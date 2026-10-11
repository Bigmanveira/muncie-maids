// Client-facing booking emails. Copy follows the brand rules in CLAUDE.md:
// warm and professional, active voice, "cleaning visit" / "cleaning team",
// and no promised outcomes. Inline styles only — email clients strip <style>.

import { siteUrl, type EmailMessage } from './email.ts'

const CLEAN_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard Clean',
  deep: 'First Time Clean',
  moveout: 'Move-out Clean',
}

// Poppins loads in Apple Mail, iOS Mail and most Android clients; Gmail
// strips web fonts, so the stack falls back to Helvetica/Arial there.
const FONT = "'Poppins',Helvetica,Arial,sans-serif"

// Served from the client site's public folder (client/public/email-logo.png).
// Overridable so emails keep a working logo before the domain is live.
function logoUrl(): string {
  return Deno.env.get('EMAIL_LOGO_URL') ?? `${siteUrl()}/email-logo.png`
}

const BRAND = {
  primary: '#D65A5A',
  secondary: '#2C5282',
  background: '#FDFBF7',
  text: '#1A1C1E',
  muted: '#64748B',
  border: '#E9E4DB',
}

export interface EmailBooking {
  customer_name: string
  customer_email: string
  clean_type: string
  service_date: string // YYYY-MM-DD
  time_window: string
  address_line: string
  city: string
  zip: string
  quoted_price: number
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function money(n: number): string {
  return `$${Number(n).toFixed(2)}`
}

function firstName(full: string): string {
  return (full.trim().split(/\s+/)[0] || 'there')
}

function detailRows(rows: [string, string][]): string {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="font-family:${FONT};padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="font-family:${FONT};padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')
}

function layout(opts: { preheader: string; heading: string; intro: string; rows: [string, string][]; cta?: { label: string; url: string }; footerNote: string }): string {
  const cta = opts.cta
    ? `<tr><td style="padding:24px 0 8px;">
         <a href="${opts.cta.url}" style="font-family:${FONT};display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px;">${escapeHtml(opts.cta.label)}</a>
       </td></tr>`
    : ''
  return `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'); body, table, td, a, p, span { font-family: ${FONT}; }</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:${FONT};">
  <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
    <tr><td align="center" style="padding-bottom:20px;">
      <img src="${logoUrl()}" width="96" height="96" alt="Muncie Maid Service" style="display:block;width:96px;height:96px;border:0;outline:none;text-decoration:none;">
    </td></tr>
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:24px;padding:32px;">
        <tr><td style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${BRAND.primary};padding-bottom:12px;">Muncie Maid Service</td></tr>
        <tr><td style="font-family:${FONT};font-size:24px;font-weight:700;color:${BRAND.text};line-height:1.25;padding-bottom:12px;">${escapeHtml(opts.heading)}</td></tr>
        <tr><td style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.6;padding-bottom:16px;">${opts.intro}</td></tr>
        <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(opts.rows)}</table></td></tr>
        ${cta}
        <tr><td style="font-family:${FONT};font-size:13px;color:${BRAND.muted};line-height:1.6;padding-top:20px;">${opts.footerNote}</td></tr>
      </table>
      <p style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;">Muncie Maid Service &middot; Serving Muncie, Yorktown, Gaston &amp; Albany</p>
    </td></tr>
  </table>
</body></html>`
}

function textDetails(rows: [string, string][]): string {
  return rows.map(([l, v]) => `${l}: ${v}`).join('\n')
}

export function bookingConfirmedEmail(b: EmailBooking, manageUrl: string): EmailMessage {
  const service = CLEAN_TYPE_LABEL[b.clean_type] ?? b.clean_type
  const date = formatDate(b.service_date)
  const rows: [string, string][] = [
    ['Service', service],
    ['Date', date],
    ['Arrival window', b.time_window],
    ['Address', `${b.address_line}, ${b.city}, IN ${b.zip}`],
    ['Total paid', money(b.quoted_price)],
  ]
  const name = firstName(b.customer_name)
  return {
    to: b.customer_email,
    subject: `Your cleaning visit is confirmed — ${date}`,
    html: layout({
      preheader: `${service} on ${date}, ${b.time_window}.`,
      heading: 'Your cleaning visit is booked',
      intro: `Hi ${escapeHtml(name)}, thanks for booking with us. We received your payment and scheduled your cleaning visit. Here are the details:`,
      rows,
      cta: { label: 'View or manage your booking', url: manageUrl },
      footerNote:
        'Need to change plans? You can cancel for a full refund up to 24 hours before your visit. Inside 24 hours, we refund 50%. Use the link above to manage your booking any time.',
    }),
    text: `Hi ${name},\n\nThanks for booking with Muncie Maid Service. We received your payment and scheduled your cleaning visit.\n\n${textDetails(rows)}\n\nView or manage your booking: ${manageUrl}\n\nYou can cancel for a full refund up to 24 hours before your visit. Inside 24 hours, we refund 50%.\n\nMuncie Maid Service`,
  }
}

export function bookingCancelledEmail(b: EmailBooking, refundAmount: number): EmailMessage {
  const service = CLEAN_TYPE_LABEL[b.clean_type] ?? b.clean_type
  const date = formatDate(b.service_date)
  const rows: [string, string][] = [
    ['Service', service],
    ['Was scheduled for', `${date}, ${b.time_window}`],
    ['Refund', refundAmount > 0 ? money(refundAmount) : 'No charge to refund'],
  ]
  const name = firstName(b.customer_name)
  const refundLine =
    refundAmount > 0
      ? 'Your refund goes back to your original payment method. Most banks post it within 5–10 business days.'
      : 'You have nothing more to do.'
  const bookUrl = siteUrl()
  return {
    to: b.customer_email,
    subject: `Your cleaning visit on ${date} is cancelled`,
    html: layout({
      preheader: refundAmount > 0 ? `We issued a refund of ${money(refundAmount)}.` : 'Your cleaning visit is cancelled.',
      heading: 'Your cleaning visit is cancelled',
      intro: `Hi ${escapeHtml(name)}, we cancelled your cleaning visit. ${refundLine}`,
      rows,
      cta: { label: 'Book another visit', url: bookUrl },
      footerNote: 'We hope to see you again soon.',
    }),
    text: `Hi ${name},\n\nWe cancelled your cleaning visit. ${refundLine}\n\n${textDetails(rows)}\n\nBook another visit: ${bookUrl}\n\nMuncie Maid Service`,
  }
}
