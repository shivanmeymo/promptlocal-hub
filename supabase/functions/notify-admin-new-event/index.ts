import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewEventRequest {
  event_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-admin-new-event function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's auth to verify they are authenticated
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_id }: NewEventRequest = await req.json();
    console.log("Notifying admin about new event:", event_id);

    // Fetch event details including approval token
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event:", eventError);
      throw new Error("Event not found");
    }

    // Verify the user owns this event
    if (event.user_id !== user.id) {
      console.error("User does not own this event");
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://your-site.lovable.app";
    const functionUrl = `${supabaseUrl}/functions/v1/handle-event-approval`;
    const approveUrl = `${functionUrl}?token=${event.approval_token}&action=approve`;
    const rejectUrl = `${functionUrl}?token=${event.approval_token}&action=reject`;

    // Send notification to admin with approve/reject buttons
    const adminEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `New Event Pending Review: ${event.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">New Event Submitted for Review</h1>
          <p>A new event has been submitted and requires your approval:</p>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Title:</strong></td>
                <td style="padding: 8px 0;">${event.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Organizer:</strong></td>
                <td style="padding: 8px 0;">${event.organizer_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;">${event.start_date} at ${event.start_time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Location:</strong></td>
                <td style="padding: 8px 0;">${event.location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Category:</strong></td>
                <td style="padding: 8px 0;">${event.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Price:</strong></td>
                <td style="padding: 8px 0;">${event.is_free ? 'Free' : `${event.price} SEK`}</td>
              </tr>
            </table>
          </div>

          <h2 style="color: #374151; font-size: 16px;">Event Description:</h2>
          <p style="color: #4b5563; background: #f3f4f6; padding: 15px; border-radius: 8px;">${event.description}</p>
          
          ${event.organizer_description ? `
            <h2 style="color: #374151; font-size: 16px;">About the Organizer:</h2>
            <p style="color: #4b5563;">${event.organizer_description}</p>
          ` : ''}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${approveUrl}" 
               style="background-color: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin-right: 12px;">
              ✓ Approve Event
            </a>
            <a href="${rejectUrl}" 
               style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              ✕ Reject Event
            </a>
          </div>

          <p style="margin-top: 30px; color: #9ca3af; font-size: 12px; text-align: center;">
            Or review in the <a href="${siteUrl}/admin" style="color: #4F46E5;">Admin Dashboard</a>
          </p>
        </div>
      `,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-admin-new-event:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);