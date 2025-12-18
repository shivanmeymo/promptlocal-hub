import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeRequest {
  subscription_id: string;
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

    const { subscription_id }: UnsubscribeRequest = await req.json();
    console.log("Unsubscribing subscription:", subscription_id);

    if (!subscription_id) {
      return new Response(
        JSON.stringify({ error: "Subscription ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the subscription to inactive
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
