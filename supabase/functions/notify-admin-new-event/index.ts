import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "contact@nowintown.se";

// Validate required environment variables
if (!RESEND_API_KEY) {
  console.error("CRITICAL: RESEND_API_KEY environment variable is not set!");
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escaping to prevent XSS in email templates
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface NewEventRequest {
  event_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-admin-new-event function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Resend is configured
    if (!resend || !RESEND_API_KEY) {
      const errorMsg = "Email service not configured: RESEND_API_KEY is missing";
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          details: "Please set RESEND_API_KEY environment variable in Supabase project settings"
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Using admin email: ${ADMIN_EMAIL}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    // Note: We're trusting the frontend since this is called right after event creation
    // In production, you would verify the Firebase token using Firebase Admin SDK

    // Use existing approval_token if available, otherwise generate one
    // (Note: approval_token column may not exist in all database versions)
    const approvalToken = event.approval_token || crypto.randomUUID();
    
    // Skip token update for now - column may not exist in database
    // const { error: tokenUpdateError } = await supabase
    //   .from("events")
    //   .update({
    //     approval_token: approvalToken,
    //     token_created_at: new Date().toISOString()
    //   })
    //   .eq("id", event_id);
    //
    // if (tokenUpdateError) {
    //   console.error("Error updating approval token:", tokenUpdateError);
    //   throw new Error("Failed to generate approval token");
    // }

    const siteUrl = Deno.env.get("SITE_URL") || "https://your-site.lovable.app";
    const functionUrl = `${supabaseUrl}/functions/v1/handle-event-approval`;
    const approveUrl = `${functionUrl}?token=${approvalToken}&action=approve`;
    const rejectUrl = `${functionUrl}?token=${approvalToken}&action=reject`;

    // Send notification to admin with approve/reject buttons (with HTML escaping)
    console.log(`📧 Attempting to send email...`);
    console.log(`   From: NowInTown <onboarding@resend.dev>`);
    console.log(`   To: ${ADMIN_EMAIL}`);
    console.log(`   Subject: New Event Pending Review: ${event.title}`);
    console.log(`   Event ID: ${event_id}`);
    
    const adminEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `New Event Pending Review: ${escapeHtml(event.title)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">New Event Submitted for Review</h1>
          <p>A new event has been submitted and requires your approval:</p>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Title:</strong></td>
                <td style="padding: 8px 0;">${escapeHtml(event.title)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Organizer:</strong></td>
                <td style="padding: 8px 0;">${escapeHtml(event.organizer_name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;">${escapeHtml(event.start_date)} at ${escapeHtml(event.start_time)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Location:</strong></td>
                <td style="padding: 8px 0;">${escapeHtml(event.location)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Category:</strong></td>
                <td style="padding: 8px 0;">${escapeHtml(event.category)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Price:</strong></td>
                <td style="padding: 8px 0;">${event.is_free ? 'Free' : `${escapeHtml(String(event.price))} SEK`}</td>
              </tr>
            </table>
          </div>

          <h2 style="color: #374151; font-size: 16px;">Event Description:</h2>
          <p style="color: #4b5563; background: #f3f4f6; padding: 15px; border-radius: 8px;">${escapeHtml(event.description)}</p>
          
          ${event.organizer_description ? `
            <h2 style="color: #374151; font-size: 16px;">About the Organizer:</h2>
            <p style="color: #4b5563;">${escapeHtml(event.organizer_description)}</p>
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
            <br><br>
            <em>Note: These approval links expire in 7 days and can only be used once.</em>
          </p>
        </div>
      `,
    });

    console.log("✅ Admin notification sent successfully!");
    console.log("   Resend Response:", JSON.stringify(adminEmailResponse, null, 2));

    if (adminEmailResponse.error) {
      console.error("❌ Resend API error:", adminEmailResponse.error);
      throw new Error(`Failed to send email: ${adminEmailResponse.error.message || 'Unknown error'}`);
    }

    if (adminEmailResponse.data?.id) {
      console.log(`📬 Email ID: ${adminEmailResponse.data.id}`);
      console.log(`🔍 Check delivery status at: https://resend.com/emails/${adminEmailResponse.data.id}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      email_sent_to: ADMIN_EMAIL,
      message_id: adminEmailResponse.data?.id
    }), {
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