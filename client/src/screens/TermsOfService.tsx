import { LegalPage } from '../components/LegalPage'

export function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" updated="August 12, 2026">
      <section>
        <h2>1. Agreement to terms</h2>
        <p>
          By booking a cleaning visit or creating an account with Muncie Maids, you agree to these terms. If you
          don't agree, please don't use the service.
        </p>
      </section>

      <section>
        <h2>2. What we offer</h2>
        <p>
          Muncie Maids connects clients in Muncie, Yorktown, Gaston, and Albany, Indiana with local cleaning teams.
          You get an instant price based on your home details and book directly — no quote requests, no callbacks.
        </p>
      </section>

      <section>
        <h2>3. Pricing and payment</h2>
        <p>
          Your price is calculated from the home details, clean type, and frequency you select, and shown to you
          before you book. We collect payment through Stripe when you confirm your booking. We don't promise
          specific outcomes or results — we promise a clear price and a scheduled visit.
        </p>
      </section>

      <section>
        <h2>4. Cancellations and rescheduling</h2>
        <p>You can cancel or reschedule a booking yourself from the Bookings tab:</p>
        <ul>
          <li>24 hours or more before your visit: full refund</li>
          <li>Less than 24 hours before your visit: 50% of your payment is retained</li>
        </ul>
        <p>Rescheduling cancels your current booking under this policy and starts a new booking for your new date.</p>
      </section>

      <section>
        <h2>5. Your account</h2>
        <p>
          You're responsible for the accuracy of the information you provide (address, entry instructions, contact
          details) and for keeping your password secure. Booking as a guest, without an account, is also fully
          supported.
        </p>
      </section>

      <section>
        <h2>6. Service area</h2>
        <p>
          We currently serve Muncie, Yorktown, Gaston, and Albany, Indiana. If your address falls outside these
          areas, we'll let you know before you book.
        </p>
      </section>

      <section>
        <h2>7. Conduct</h2>
        <p>
          Please provide a safe, accessible environment for your cleaning team and accurate entry instructions. We
          reserve the right to decline or cancel a booking for safety reasons.
        </p>
      </section>

      <section>
        <h2>8. Limitation of liability</h2>
        <p>
          Muncie Maids is not liable for indirect or incidental damages arising from use of the service, to the
          extent permitted by Indiana law. Nothing in these terms limits liability that can't be limited by law.
        </p>
      </section>

      <section>
        <h2>9. Governing law</h2>
        <p>These terms are governed by the laws of the State of Indiana.</p>
      </section>

      <section>
        <h2>10. Changes to these terms</h2>
        <p>We'll update the date at the top of this page when these terms change and, for material changes, let you know directly.</p>
      </section>

      <section>
        <h2>11. Contact us</h2>
        <p>Questions about these terms? Email us at support@munciemaids.com.</p>
      </section>
    </LegalPage>
  )
}
