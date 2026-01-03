// Admin-only Edge Function for managing contact messages
// Protect with RLS bypass only via service role key or custom auth (e.g., JWT claim check).
// Deploy: supabase functions deploy contact-admin
// Invoke with Authorization: Bearer <service-role-key> from server/admin tooling ONLY.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const pathname = url.pathname

  try {
    const apikey = req.headers.get('apikey') || ''
    const auth = req.headers.get('authorization') || ''

    // Minimal protection: require a Bearer token present (service role in admin usage)
    if (!auth.toLowerCase().startsWith('bearer ') || apikey.length === 0) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const projectUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // List messages: GET /
    if (req.method === 'GET' && pathname.endsWith('/contact-admin')) {
      const r = await fetch(`${projectUrl}/rest/v1/app.contact_messages?select=*&order=created_at.desc`, {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        }
      })
      const data = await r.json()
      return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update status: PATCH /?id=123&status=resolved
    if (req.method === 'PATCH' && pathname.endsWith('/contact-admin')) {
      const id = url.searchParams.get('id')
      const status = url.searchParams.get('status')
      if (!id || !status) {
        return new Response(JSON.stringify({ error: 'id and status are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const r = await fetch(`${projectUrl}/rest/v1/app.contact_messages?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      const data = await r.json()
      return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
