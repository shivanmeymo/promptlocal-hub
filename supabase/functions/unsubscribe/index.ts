import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeRequest {
  subscription_id: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("unsubscribe function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { subscription_id, email }: UnsubscribeRequest = await req.json();
    console.log("Unsubscribing subscription:", subscription_id);

    if (!subscription_id || !email) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch subscription and verify email matches
    const { data: subscription, error: fetchError } = await supabase
      .from("event_notifications")
      .select("email, id")
      .eq("id", subscription_id)
      .single();

    if (fetchError || !subscription) {
      console.error("Subscription not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify email ownership
    if (subscription.email.toLowerCase() !== email.toLowerCase()) {
      console.error("Email mismatch for subscription");
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Now safe to unsubscribe
    const { error } = await supabase
      .from("event_notifications")
      .update({ is_active: false })
      .eq("id", subscription_id);

    if (error) {
      console.error("Error unsubscribing:", error);
      throw new Error("Failed to unsubscribe");
    }

    console.log("Successfully unsubscribed");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in unsubscribe:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
