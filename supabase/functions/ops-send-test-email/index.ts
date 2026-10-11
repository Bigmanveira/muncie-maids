import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'
import { sendEmail, siteUrl } from '../_shared/email.ts'
import { bookingConfirmedEmail } from '../_shared/emailTemplates.ts'

// Email setup check for ops: sends a sample booking confirmation to the
// signed-in ops user's own address, so whoever runs the business can verify
// Resend end to end (API key, verified domain, logo, rendering) without
// making a real booking.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  if (!Deno.env.get('RESEND_API_KEY')) {
    return errorResponse('NOT_CONFIGURED', 'Email is not set up yet — the RESEND_API_KEY secret is missing.', 409)
  }

  const sample = bookingConfirmedEmail(
    {
      customer_name: ops.name || 'Test Client',
      customer_email: ops.email,
      clean_type: 'standard',
      service_date: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
      time_window: '8:00-11:00 AM',
      address_line: '123 W Main St',
      city: 'Muncie',
      zip: '47305',
      quoted_price: 149,
    },
    siteUrl(),
  )

  const sent = await sendEmail({ ...sample, subject: `[Test] ${sample.subject}` })
  if (!sent) {
    return errorResponse(
      'SEND_FAILED',
      "Resend rejected the email. Check that munciemaids.com shows Verified in Resend and that the API key has sending access.",
      502,
    )
  }

  return jsonResponse({ status: 'sent', to: ops.email })
})
