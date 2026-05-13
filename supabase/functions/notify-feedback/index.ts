// Supabase Edge Function: notify-feedback
//
// Triggered by a Database Webhook on INSERT INTO feedback.
// Formats the new row and POSTs to Resend's /emails endpoint so the developer
// receives an email for every submission.
//
// Required secrets (set via `supabase secrets set ...`):
//   RESEND_API_KEY            — Resend API key
//   FEEDBACK_RECIPIENT_EMAIL  — destination address (e.g., remleynick@yahoo.com)
//   FEEDBACK_FROM_EMAIL       — verified sender address on Resend
//                               (e.g., feedback@boges2birds.com or onboarding@resend.dev)

// @ts-expect-error — Deno-specific import resolved at runtime by Supabase Edge runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

interface FeedbackRow {
  id: string
  user_id: string | null
  is_guest: boolean
  type: 'bug' | 'improvement'
  message: string
  reply_email: string | null
  context: Record<string, unknown>
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: FeedbackRow
  schema: string
  old_record: FeedbackRow | null
}

// @ts-expect-error — Deno global available in the Supabase Edge runtime
const env = Deno.env

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function buildEmail(row: FeedbackRow): { subject: string; text: string } {
  const typeLabel = row.type === 'bug' ? 'Bug' : 'Improvement'
  const summary = truncate(row.message.replace(/\s+/g, ' ').trim(), 60)
  const subject = `[Boges2Birds] ${typeLabel}: ${summary}`

  const ctx = row.context ?? {}
  const diagnosticLines = [
    `User ID:    ${row.user_id ?? '(none)'}`,
    `Guest:      ${row.is_guest ? 'yes' : 'no'}`,
    `Reply to:   ${row.reply_email ?? '(not provided)'}`,
    `App:        ${ctx['app_version'] ?? '?'}`,
    `Platform:   ${ctx['platform'] ?? '?'} ${ctx['os_version'] ?? ''}`.trim(),
    `Program:    ${ctx['active_program_slug'] ?? '(none)'}`,
    `Submitted:  ${row.created_at}`,
  ]

  const text = [
    `${typeLabel} report from Boges2Birds`,
    '',
    '─── Message ───────────────────────────────────',
    row.message,
    '',
    '─── Diagnostics ───────────────────────────────',
    ...diagnosticLines,
    '',
    `Feedback ID: ${row.id}`,
  ].join('\n')

  return { subject, text }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = env.get('RESEND_API_KEY')
  const to = env.get('FEEDBACK_RECIPIENT_EMAIL')
  const from = env.get('FEEDBACK_FROM_EMAIL')
  if (!apiKey || !to || !from) {
    return new Response('Missing required secrets', { status: 500 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (payload.type !== 'INSERT' || payload.table !== 'feedback' || !payload.record) {
    return new Response('Ignored', { status: 200 })
  }

  const { subject, text } = buildEmail(payload.record)
  const replyTo = payload.record.reply_email?.trim() || undefined

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  if (!resendRes.ok) {
    const body = await resendRes.text()
    return new Response(`Resend error ${resendRes.status}: ${body}`, { status: 502 })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
