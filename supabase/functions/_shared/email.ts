// Transactional email via Resend's REST API (no SDK needed in Deno).
//
// Config (Supabase function secrets):
//   RESEND_API_KEY  required — until it's set, sends are skipped with a log
//                   line, so the booking flow never breaks on email setup
//   EMAIL_FROM      optional — defaults to the verified munciemaids.com sender
//   EMAIL_REPLY_TO  optional — inbox that receives client replies
//   SITE_URL        optional — base for links in emails
//
// sendEmail never throws: an email failure must not fail a payment webhook
// or a cancellation. Callers get a boolean and can log the outcome.

const DEFAULT_FROM = 'Muncie Maid Service <bookings@munciemaids.com>'

export function siteUrl(): string {
  return (Deno.env.get('SITE_URL') ?? 'https://munciemaids.com').replace(/\/$/, '')
}

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email:', msg.subject)
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('EMAIL_FROM') ?? DEFAULT_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        // Only set once a real inbox exists — support@ is still a placeholder.
        ...(Deno.env.get('EMAIL_REPLY_TO') ? { reply_to: Deno.env.get('EMAIL_REPLY_TO') } : {}),
      }),
    })
    if (!res.ok) {
      console.error('Resend send failed', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('Resend send error', err)
    return false
  }
}
