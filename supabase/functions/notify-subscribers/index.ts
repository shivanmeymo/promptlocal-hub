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

interface NotifyRequest {
  event_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-subscribers function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_id }: NotifyRequest = await req.json();
    console.log("Notifying subscribers about approved event:", event_id);

    // Fetch the approved event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .eq("status", "approved")
      .single();

    if (eventError || !event) {
      console.error("Event not found or not approved:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found or not approved" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch all active notification subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("event_notifications")
      .select("*")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw new Error("Failed to fetch subscriptions");
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    // Filter subscriptions that match the event
    const matchingSubscriptions = (subscriptions || []).filter((sub) => {
      const filters = sub.filters as {
        location?: string;
        category?: string;
        freeOnly?: boolean;
        keywords?: string[];
      } | null;

      if (!filters) return true; // No filters = match all events

      // Check location filter
      if (filters.location) {
        const eventLocation = event.location?.toLowerCase() || "";
        const filterLocation = filters.location.toLowerCase();
        if (!eventLocation.includes(filterLocation)) {
          return false;
        }
      }

      // Check category filter
      if (filters.category && filters.category !== event.category) {
        return false;
      }

      // Check free only filter
      if (filters.freeOnly && !event.is_free) {
        return false;
      }

      // Check keywords
      if (filters.keywords && filters.keywords.length > 0) {
        const eventText = `${event.title} ${event.description}`.toLowerCase();
        const hasMatchingKeyword = filters.keywords.some((kw: string) =>
          eventText.includes(kw.toLowerCase())
        );
        if (!hasMatchingKeyword) {
          return false;
        }
      }

      return true;
    });

    console.log(`${matchingSubscriptions.length} subscriptions match the event`);

    const siteUrlRaw = Deno.env.get("SITE_URL") || "https://szmnfthiblejkjfdbeba.lovableproject.com";
    const siteUrl = siteUrlRaw.replace(/\/+$/, "");

    // Send emails to matching subscribers
    const emailPromises = matchingSubscriptions.map(async (sub) => {
      const unsubscribeUrl = `${siteUrl}/unsubscribe?id=${sub.id}&email=${encodeURIComponent(sub.email)}`;
      
      try {
        // Escape user-controlled content for HTML safety
        const escapedDescription = escapeHtml(event.description?.substring(0, 200) || '');
        const descriptionSuffix = (event.description?.length || 0) > 200 ? '...' : '';
        
        await resend.emails.send({
          from: "NowInTown <onboarding@resend.dev>",
          to: [sub.email],
          subject: `New Event: ${escapeHtml(event.title)}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4F46E5;">🎉 New Event Matching Your Preferences!</h1>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #1f2937;">${escapeHtml(event.title)}</h2>
                <p style="color: #4b5563;">${escapedDescription}${descriptionSuffix}</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>📅 Date:</strong></td>
                    <td style="padding: 8px 0;">${escapeHtml(event.start_date)} at ${escapeHtml(event.start_time)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>📍 Location:</strong></td>
                    <td style="padding: 8px 0;">${escapeHtml(event.location)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>🎭 Category:</strong></td>
                    <td style="padding: 8px 0;">${escapeHtml(event.category)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>💰 Price:</strong></td>
                    <td style="padding: 8px 0;">${event.is_free ? 'Free!' : `${escapeHtml(String(event.price))} SEK`}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${siteUrl}" 
                   style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  View Event Details
                </a>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                You received this email because you subscribed to event notifications on NowInTown.
                <br><br>
                <a href="${siteUrl}" style="color: #4F46E5;">Visit NowInTown</a>
                &nbsp;|&nbsp;
                <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </div>
          `,
        });
        console.log(`Email sent to ${sub.email}`);
        return { success: true, email: sub.email };
      } catch (emailError) {
        console.error(`Failed to send email to ${sub.email}:`, emailError);
        return { success: false, email: sub.email, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Sent ${successCount}/${matchingSubscriptions.length} notification emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: matchingSubscriptions.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-subscribers:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
