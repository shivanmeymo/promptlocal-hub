import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const siteUrl = Deno.env.get("SITE_URL") || "https://szmnfthiblejkjfdbeba.lovableproject.com";

    if (!token || !action || !["approve", "reject"].includes(action)) {
      const redirectUrl = new URL(`${siteUrl}/approval-result`);
      redirectUrl.searchParams.set("status", "invalid");
      redirectUrl.searchParams.set("error", encodeURIComponent("Saknade eller ogiltiga parametrar"));
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl.toString() },
      });
    }

    // Find event by approval token
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      const redirectUrl = new URL(`${siteUrl}/approval-result`);
      redirectUrl.searchParams.set("status", "invalid");
      redirectUrl.searchParams.set("error", encodeURIComponent("Evenemanget kunde inte hittas"));
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl.toString() },
      });
    }

    // Check token expiration (7 days)
    const TOKEN_EXPIRY_DAYS = 7;
    const tokenCreatedAt = event.token_created_at ? new Date(event.token_created_at) : new Date(event.created_at);
    const expiryDate = new Date(tokenCreatedAt.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    if (new Date() > expiryDate) {
      console.log("Token expired for event:", event.id, "Created at:", tokenCreatedAt, "Expired at:", expiryDate);
      const redirectUrl = new URL(`${siteUrl}/approval-result`);
      redirectUrl.searchParams.set("status", "expired");
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl.toString() },
      });
    }

    if (event.status !== "pending") {
      const redirectUrl = new URL(`${siteUrl}/approval-result`);
      redirectUrl.searchParams.set("status", "already_processed");
      redirectUrl.searchParams.set("current_status", event.status);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl.toString() },
      });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Log the approval action
    console.log("Processing event approval:", {
      event_id: event.id,
      action: action,
      timestamp: new Date().toISOString(),
      token_used: token.substring(0, 8) + "..." // Log partial token for audit
    });

    // Update event status and invalidate token (single-use)
    const { error: updateError } = await supabase
      .from("events")
      .update({
        status: newStatus,
        approved_at: action === "approve" ? new Date().toISOString() : null,
        approval_token: null, // Invalidate token after use
        token_created_at: null
      })
      .eq("id", event.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update event status");
    }
    
    console.log("Event status updated successfully:", event.id, "->", newStatus);

    // If approved, trigger subscriber notifications
    if (action === "approve") {
      try {
        console.log("Triggering subscriber notifications for event:", event.id);
        const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/notify-subscribers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ event_id: event.id }),
        });
        const notifyResult = await notifyResponse.json();
        console.log("Subscriber notification result:", notifyResult);
      } catch (notifyError) {
        console.error("Failed to trigger subscriber notifications:", notifyError);
        // Don't fail the approval if notifications fail
      }
    }

    // Send notification email to organizer
    const statusText = action === "approve" ? "approved and published" : "rejected";
    const statusTextSv = action === "approve" ? "godkänt och publicerat" : "avvisat";

    try {
      await resend.emails.send({
        from: "NowInTown <onboarding@resend.dev>",
        to: [event.organizer_email],
        subject: action === "approve"
          ? `Your event "${escapeHtml(event.title)}" has been approved!`
          : `Update on your event "${escapeHtml(event.title)}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: ${action === "approve" ? "#22c55e" : "#ef4444"};">
              ${action === "approve" ? "🎉 Event Approved!" : "Event Update"}
            </h1>
            <p>Dear ${escapeHtml(event.organizer_name)},</p>
            <p>Your event "<strong>${escapeHtml(event.title)}</strong>" has been <strong>${statusText}</strong>.</p>
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

    // Redirect admin to homepage after approval/rejection
    const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
    
    return new Response(null, {
      status: 302,
      headers: { 
        ...corsHeaders, 
        "Location": normalizedSiteUrl 
      },
    });
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
