import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventApprovalRequest {
  event_id: string;
  status: "approved" | "rejected";
  admin_notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-event-approval-notification function called");

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

    // Create client with user's auth to verify they are an admin
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

    // Verify user is an admin
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !userRole) {
      console.error("User is not an admin");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { event_id, status, admin_notes }: EventApprovalRequest = await req.json();
    console.log("Processing event approval notification for event:", event_id, "status:", status);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event:", eventError);
      throw new Error("Event not found");
    }

    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusColor = status === "approved" ? "#22c55e" : "#ef4444";

    // Send notification to event organizer
    const organizerEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [event.organizer_email],
      subject: `Your Event "${event.title}" has been ${statusText}`,
      html: `
        <h1>Event ${statusText}</h1>
        <p>Dear ${event.organizer_name},</p>
        <p>Your event "<strong>${event.title}</strong>" has been <span style="color: ${statusColor}; font-weight: bold;">${statusText.toLowerCase()}</span>.</p>
        ${status === "approved" ? `
          <p>Your event is now live and visible to the public!</p>
          <h2>Event Details:</h2>
          <ul>
            <li><strong>Date:</strong> ${event.start_date}</li>
            <li><strong>Time:</strong> ${event.start_time}</li>
            <li><strong>Location:</strong> ${event.location}</li>
          </ul>
        ` : `
          <p>Unfortunately, your event did not meet our guidelines.</p>
          ${admin_notes ? `<p><strong>Reason:</strong> ${admin_notes}</p>` : ""}
          <p>Feel free to update your event and resubmit it for review.</p>
        `}
        <p>Best regards,<br>The NowInTown Team</p>
      `,
    });

    console.log("Organizer notification sent:", organizerEmailResponse);

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `Event ${statusText}: ${event.title}`,
      html: `
        <h1>Event ${statusText}</h1>
        <p>The following event has been ${statusText.toLowerCase()}:</p>
        <ul>
          <li><strong>Title:</strong> ${event.title}</li>
          <li><strong>Organizer:</strong> ${event.organizer_name} (${event.organizer_email})</li>
          <li><strong>Date:</strong> ${event.start_date}</li>
          <li><strong>Location:</strong> ${event.location}</li>
        </ul>
        ${admin_notes ? `<p><strong>Admin Notes:</strong> ${admin_notes}</p>` : ""}
      `,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-event-approval-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);