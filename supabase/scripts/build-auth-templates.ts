// Renders Supabase Auth's email templates with the same branded layout as
// the booking emails, into supabase/templates/. Paste each file into
// Supabase Dashboard > Authentication > Emails > Templates (subjects are in
// templates/SUBJECTS.md). Re-run after changing the shared layout:
//   npx deno run --allow-env --allow-write scripts/build-auth-templates.ts
import { renderLayout } from '../functions/_shared/emailTemplates.ts'

const templates: Record<string, { subject: string; heading: string; intro: string; cta: string; footer: string }> = {
  'confirm-signup': {
    subject: 'Confirm your Muncie Maid Service account',
    heading: 'Confirm your email',
    intro: 'Thanks for creating a Muncie Maid Service account. Confirm your email address to finish setting it up.',
    cta: 'Confirm my email',
    footer: "If you didn't create this account, you can ignore this email.",
  },
  'reset-password': {
    subject: 'Reset your Muncie Maid Service password',
    heading: 'Reset your password',
    intro: 'We received a request to reset the password for your Muncie Maid Service account. Use the button below to choose a new one.',
    cta: 'Choose a new password',
    footer: "If you didn't ask to reset your password, you can ignore this email. Your password stays the same.",
  },
  'change-email': {
    subject: 'Confirm your new Muncie Maid Service email',
    heading: 'Confirm your new email',
    intro: 'Confirm that you want to use {{ .NewEmail }} for your Muncie Maid Service account.',
    cta: 'Confirm new email',
    footer: "If you didn't request this change, you can ignore this email. Your current address stays on your account.",
  },
}

let subjects = '# Supabase Auth email subjects\n\n'
for (const [file, t] of Object.entries(templates)) {
  const html = renderLayout({
    preheader: t.intro.replace('{{ .NewEmail }}', 'your new address'),
    heading: t.heading,
    intro: t.intro,
    rows: [],
    cta: { label: t.cta, url: '{{ .ConfirmationURL }}' },
    footerNote: t.footer,
  })
  await Deno.writeTextFile(new URL(`../templates/${file}.html`, import.meta.url), html)
  subjects += `- **${file}**: ${t.subject}\n`
}
await Deno.writeTextFile(new URL('../templates/SUBJECTS.md', import.meta.url), subjects)
console.log('wrote', Object.keys(templates).length, 'templates')
