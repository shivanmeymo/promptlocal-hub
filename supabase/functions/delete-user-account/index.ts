import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("delete-user-account function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get the authorization header from the request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create a client with the user's auth token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Deleting account for user:", user.id);

    // Create a service role client to perform admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables in proper order
    // 1. Delete events (has references)
    const { error: eventsError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('user_id', user.id);
    if (eventsError) console.error("Error deleting events:", eventsError);

    // 2. Delete ai_usage
    const { error: aiUsageError } = await supabaseAdmin
      .from('ai_usage')
      .delete()
      .eq('user_id', user.id);
    if (aiUsageError) console.error("Error deleting ai_usage:", aiUsageError);

    // 3. Delete event_notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('event_notifications')
      .delete()
      .eq('user_id', user.id);
    if (notificationsError) console.error("Error deleting notifications:", notificationsError);

    // 4. Delete profiles
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
    if (profilesError) console.error("Error deleting profiles:", profilesError);

    // 5. Delete user_roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    if (rolesError) console.error("Error deleting user_roles:", rolesError);

    // 6. Delete storage files from event-images bucket
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('event-images')
        .list(`${user.id}/`);
      
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        const { error: storageError } = await supabaseAdmin.storage
          .from('event-images')
          .remove(filePaths);
        if (storageError) console.error("Error deleting storage files:", storageError);
      }
    } catch (storageErr) {
      console.error("Error listing storage files:", storageErr);
    }

    // 7. Delete the auth.users record (CRITICAL)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Successfully deleted user account:", user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in delete-user-account:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
