import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "shivan.meymo@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  name: string;
  email: string;
  phone?: string;
  category?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-contact-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, category, message }: ContactNotificationRequest = await req.json();
    console.log("Received contact form submission from:", name, email);

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `New Contact Form Submission: ${category || "General"}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        ${category ? `<p><strong>Category:</strong> ${category}</p>` : ""}
        <hr>
        <h2>Message:</h2>
        <p>${message}</p>
      `,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // Send confirmation to user
    const userEmailResponse = await resend.emails.send({
      from: "NowInTown <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br>The NowInTown Team</p>
      `,
    });

    console.log("User confirmation sent:", userEmailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
