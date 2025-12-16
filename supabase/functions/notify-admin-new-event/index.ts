import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "shivan.meymo@gmail.com";

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_id }: NewEventRequest = await req.json();
    console.log("Notifying admin about new event:", event_id);

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

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `New Event Pending Review: ${event.title}`,
      html: `
        <h1>New Event Submitted for Review</h1>
        <p>A new event has been submitted and requires your approval:</p>
        <ul>
          <li><strong>Title:</strong> ${event.title}</li>
          <li><strong>Organizer:</strong> ${event.organizer_name} (${event.organizer_email})</li>
          <li><strong>Date:</strong> ${event.start_date} at ${event.start_time}</li>
          <li><strong>Location:</strong> ${event.location}</li>
          <li><strong>Category:</strong> ${event.category}</li>
          <li><strong>Price:</strong> ${event.is_free ? 'Free' : `${event.price} SEK`}</li>
        </ul>
        <h2>Event Description:</h2>
        <p>${event.description}</p>
        ${event.organizer_description ? `<h2>About the Organizer:</h2><p>${event.organizer_description}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${Deno.env.get("SITE_URL") || "https://your-site.lovable.app"}/admin" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Review Event in Dashboard
          </a>
        </p>
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
