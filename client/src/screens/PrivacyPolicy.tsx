import { LegalPage } from '../components/LegalPage'

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="August 12, 2026">
      <section>
        <h2>1. What we collect</h2>
        <p>When you request a price or book a cleaning visit, we collect the information needed to fulfill it:</p>
        <ul>
          <li>Contact details: your name, email address, and phone number</li>
          <li>Service address and any entry instructions or pet notes you provide</li>
          <li>Booking details: home size, clean type, frequency, date, and arrival window</li>
          <li>Payment information, handled entirely by our payment processor, Stripe — we never see or store your full card number</li>
        </ul>
        <p>If you create an account, we store your name, email, and phone number so you don't have to re-enter them next time.</p>
      </section>

      <section>
        <h2>2. How we use it</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Calculate your price and schedule your cleaning visit</li>
          <li>Match you with a local cleaning team and share the details they need to complete the job</li>
          <li>Send booking confirmations, reminders, and support responses</li>
          <li>Process payments and refunds</li>
          <li>Improve our service area, scheduling, and pricing over time</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>3. Who we share it with</h2>
        <p>We share information only with the services that make booking work:</p>
        <ul>
          <li>Stripe, for payment processing</li>
          <li>Supabase, our database and hosting provider</li>
          <li>Your assigned cleaning team, limited to what they need to complete your visit (name, address, entry notes, pet notes)</li>
          <li>SMS/email providers, to send confirmations and reminders, once that integration is live</li>
        </ul>
        <p>We do not share your information with advertisers.</p>
      </section>

      <section>
        <h2>4. How long we keep it</h2>
        <p>
          We keep booking records for as long as your account is active and for a reasonable period afterward for
          accounting, tax, and dispute-resolution purposes. You can ask us to delete your account data at any time
          (see Section 6).
        </p>
      </section>

      <section>
        <h2>5. Cookies and local storage</h2>
        <p>
          The app stores a small amount of data in your browser (your session, your current booking in progress, and
          your login state) so the experience is fast and doesn't lose your place. We don't use third-party
          advertising trackers.
        </p>
      </section>

      <section>
        <h2>6. Your choices</h2>
        <p>
          You can review or update your profile information at any time from the Profile tab. To request a copy of
          your data or ask us to delete your account, contact us using the details below.
        </p>
      </section>

      <section>
        <h2>7. Children's privacy</h2>
        <p>Muncie Maids is intended for adults booking home cleaning services. We do not knowingly collect information from children.</p>
      </section>

      <section>
        <h2>8. Changes to this policy</h2>
        <p>We'll update the date at the top of this page when this policy changes and, for material changes, let you know directly.</p>
      </section>

      <section>
        <h2>9. Contact us</h2>
        <p>Questions about this policy? Email us at privacy@munciemaids.com.</p>
      </section>
    </LegalPage>
  )
}
