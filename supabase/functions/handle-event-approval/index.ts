import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("handle-event-approval function called");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (!token || !action || !["approve", "reject"].includes(action)) {
      return new Response(
        `<!DOCTYPE html>
        <html><head><title>Invalid Request</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Invalid Request</h1>
          <p>Missing or invalid parameters.</p>
        </body></html>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Find event by approval token
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      return new Response(
        `<!DOCTYPE html>
        <html><head><title>Event Not Found</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Event Not Found</h1>
          <p>This link may have expired or the event no longer exists.</p>
        </body></html>`,
        { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (event.status !== "pending") {
      return new Response(
        `<!DOCTYPE html>
        <html><head><title>Already Processed</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Already Processed</h1>
          <p>This event has already been ${event.status}.</p>
        </body></html>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update event status
    const { error: updateError } = await supabase
      .from("events")
      .update({
        status: newStatus,
        approved_at: action === "approve" ? new Date().toISOString() : null,
      })
      .eq("id", event.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update event status");
    }

    // Send notification email to organizer
    const statusText = action === "approve" ? "approved and published" : "rejected";
    const statusTextSv = action === "approve" ? "godkänt och publicerat" : "avvisat";

    try {
      await resend.emails.send({
        from: "NowInTown <onboarding@resend.dev>",
        to: [event.organizer_email],
        subject: action === "approve"
          ? `Your event "${event.title}" has been approved!`
          : `Update on your event "${event.title}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: ${action === "approve" ? "#22c55e" : "#ef4444"};">
              ${action === "approve" ? "🎉 Event Approved!" : "Event Update"}
            </h1>
            <p>Dear ${event.organizer_name},</p>
            <p>Your event "<strong>${event.title}</strong>" has been <strong>${statusText}</strong>.</p>
            ${action === "approve"
              ? `<p>Your event is now live and visible to everyone on NowInTown!</p>
                 <p><a href="${Deno.env.get("SITE_URL") || "https://your-site.lovable.app"}/events/${event.id}" 
                    style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Your Event
                 </a></p>`
              : `<p>Unfortunately, your event did not meet our guidelines. You can edit and resubmit your event.</p>`}
            <p>Best regards,<br>The NowInTown Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send organizer email:", emailError);
    }

    // Return success page
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Event ${action === "approve" ? "Approved" : "Rejected"}</title>
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 50px; background: #f9fafb; }
          .card { background: white; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .success { color: #22c55e; }
          .reject { color: #ef4444; }
          h1 { margin-bottom: 20px; }
          p { color: #6b7280; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="${action === "approve" ? "success" : "reject"}">
            ${action === "approve" ? "✅ Event Approved!" : "❌ Event Rejected"}
          </h1>
          <p><strong>"${event.title}"</strong> has been ${statusText}.</p>
          <p>The event organizer (${event.organizer_email}) has been notified.</p>
        </div>
      </body>
      </html>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("Error in handle-event-approval:", error);
    return new Response(
      `<!DOCTYPE html>
      <html><head><title>Error</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>Error</h1>
        <p>${error.message}</p>
      </body></html>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
};

serve(handler);
