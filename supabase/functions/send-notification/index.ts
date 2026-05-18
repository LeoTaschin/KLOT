import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const { recipientId, title, body, data } = await req.json()

  if (!recipientId || !title || !body) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', recipientId)
    .single()

  if (!profile?.push_token) {
    return new Response(JSON.stringify({ ok: true, skipped: 'no_token' }), { status: 200 })
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }),
  })

  const result = await res.json()
  return new Response(JSON.stringify(result), { status: 200 })
})
