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

    // Use service role for database operations
    // Note: Authentication is handled by the admin dashboard before calling this function
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Send notification to event organizer (with HTML escaping)
    const organizerEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [event.organizer_email],
      subject: `Your Event "${escapeHtml(event.title)}" has been ${statusText}`,
      html: `
        <h1>Event ${statusText}</h1>
        <p>Dear ${escapeHtml(event.organizer_name)},</p>
        <p>Your event "<strong>${escapeHtml(event.title)}</strong>" has been <span style="color: ${statusColor}; font-weight: bold;">${statusText.toLowerCase()}</span>.</p>
        ${status === "approved" ? `
          <p>Your event is now live and visible to the public!</p>
          <h2>Event Details:</h2>
          <ul>
            <li><strong>Date:</strong> ${escapeHtml(event.start_date)}</li>
            <li><strong>Time:</strong> ${escapeHtml(event.start_time)}</li>
            <li><strong>Location:</strong> ${escapeHtml(event.location)}</li>
          </ul>
        ` : `
          <p>Unfortunately, your event did not meet our guidelines.</p>
          ${admin_notes ? `<p><strong>Reason:</strong> ${escapeHtml(admin_notes)}</p>` : ""}
          <p>Feel free to update your event and resubmit it for review.</p>
        `}
        <p>Best regards,<br>The NowInTown Team</p>
      `,
    });

    console.log("Organizer notification sent:", organizerEmailResponse);

    // Send notification to admin (with HTML escaping)
    const adminEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `Event ${statusText}: ${escapeHtml(event.title)}`,
      html: `
        <h1>Event ${statusText}</h1>
        <p>The following event has been ${statusText.toLowerCase()}:</p>
        <ul>
          <li><strong>Title:</strong> ${escapeHtml(event.title)}</li>
          <li><strong>Organizer:</strong> ${escapeHtml(event.organizer_name)} (${escapeHtml(event.organizer_email)})</li>
          <li><strong>Date:</strong> ${escapeHtml(event.start_date)}</li>
          <li><strong>Location:</strong> ${escapeHtml(event.location)}</li>
        </ul>
        ${admin_notes ? `<p><strong>Admin Notes:</strong> ${escapeHtml(admin_notes)}</p>` : ""}
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