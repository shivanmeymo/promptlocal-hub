// Edge Function skeleton for sending notifications.
// Replace the TODO section with real email/push integration.
// Deploy: supabase functions deploy event-notify

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Body = {
  event_id: string;
  user_id?: string;
  type: 'reminder'|'update'|'cancellation'|'custom';
  channel: 'email'|'push'|'sms'|'in_app';
  payload?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const projectUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const body = (await req.json()) as Body
    if (!body?.event_id) return new Response(JSON.stringify({ error: 'event_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // 1) Create notification row (pending)
    const createRes = await fetch(`${projectUrl}/rest/v1/app.event_notifications`, {
      method: 'POST',
      headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, status: 'pending' })
    })
    const created = await createRes.json()

    // 2) TODO: send via your provider (email/push). For now, mark as sent.
    const id = Array.isArray(created) ? created[0]?.id : created?.id
    if (id) {
      await fetch(`${projectUrl}/rest/v1/app.event_notifications?id=eq.${id}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() })
      })
    }

    return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
