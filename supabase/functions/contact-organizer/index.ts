import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input sanitization
function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

interface ContactOrganizerRequest {
  eventId: string;
  eventTitle: string;
  senderName: string;
  senderEmail: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ContactOrganizerRequest = await req.json();
    
    // Validate and sanitize inputs
    const eventId = sanitizeInput(body.eventId, 50);
    const eventTitle = sanitizeInput(body.eventTitle, 200);
    const senderName = sanitizeInput(body.senderName, 100);
    const senderEmail = sanitizeInput(body.senderEmail, 255);
    const message = sanitizeInput(body.message, 2000);

    if (!eventId || !senderName || !senderEmail || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(senderEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role to access organizer email
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the event to get organizer email (server-side only)
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("organizer_email, organizer_name, status")
      .eq("id", eventId)
      .eq("status", "approved")
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found or not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending contact message for event ${eventId} to ${event.organizer_email}`);

    // Send email to organizer
    const { error: emailError } = await resend.emails.send({
      from: "NowInTown <noreply@resend.dev>",
      to: [event.organizer_email],
      reply_to: senderEmail,
      subject: `New inquiry about your event: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New message about your event</h2>
          <p>Hi ${event.organizer_name},</p>
          <p>You have received a new inquiry about your event <strong>"${eventTitle}"</strong> on NowInTown.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${senderName}</p>
            <p><strong>Email:</strong> ${senderEmail}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          
          <p>You can reply directly to this email to respond to ${senderName}.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This message was sent via NowInTown contact form. Do not share your personal information with unknown contacts.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation to sender
    await resend.emails.send({
      from: "NowInTown <noreply@resend.dev>",
      to: [senderEmail],
      subject: `Your message to ${event.organizer_name} has been sent`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Message sent successfully!</h2>
          <p>Hi ${senderName},</p>
          <p>Your message regarding <strong>"${eventTitle}"</strong> has been sent to the organizer.</p>
          <p>They will respond to you at this email address if they wish to get in touch.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your message:</strong></p>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Thank you for using NowInTown!</p>
        </div>
      `,
    });

    console.log(`Successfully sent contact message for event ${eventId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Contact organizer error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
