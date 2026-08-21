import { useState } from 'react'
import { Icon } from '@iconify/react'
import { LegalPage } from '../components/LegalPage'
import { useAuth } from '../context/AuthContext'

export function Agreement() {
  const { signAgreement } = useAuth()
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSign() {
    setSubmitting(true)
    setError(null)
    try {
      await signAgreement()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign the agreement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-40">
      <LegalPage title="Independent Contractor Agreement" updated="August 2026">
        <section>
          <h2>1. Independent contractor relationship</h2>
          <p>
            You provide cleaning services to Muncie Maids clients as an independent contractor, not an employee.
            You choose which posted gigs to claim, set your own schedule, and use your own equipment and supplies
            unless you've indicated otherwise. Muncie Maids does not direct the manner or method of your work.
          </p>
        </section>
        <section>
          <h2>2. No mandatory shifts or exclusivity</h2>
          <p>
            There are no minimum claims, no required hours, and no exclusivity. You're free to work with other
            clients or platforms. Declining a gig has no effect on your account standing.
          </p>
        </section>
        <section>
          <h2>3. Pay</h2>
          <p>
            Each gig posts its price up front. You're paid 70% of that price for completed jobs, via weekly manual
            transfer, recorded in your Earnings tab. You're responsible for your own taxes; we'll collect a W-9
            before your first payout.
          </p>
        </section>
        <section>
          <h2>4. Reliability</h2>
          <p>
            We track completed jobs and released claims — never whether you chose to claim a gig in the first
            place. Releasing a claim more than 48 hours before the visit carries no penalty.
          </p>
        </section>
        <section>
          <h2>5. Client information</h2>
          <p>
            A gig's exact address is shown only after you claim it. Please don't solicit clients you meet through
            the platform for off-platform work.
          </p>
        </section>
        <section>
          <h2>6. Termination</h2>
          <p>Either party may end this arrangement at any time, for any reason.</p>
        </section>
      </LegalPage>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setAgreed((v) => !v)}
            className="w-full flex items-center gap-3 mb-4 text-left"
          >
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                agreed ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              {agreed && <Icon icon="solar:check-bold" className="text-white text-sm" />}
            </div>
            <span className="text-sm font-medium text-foreground">I've read and agree to this agreement.</span>
          </button>

          {error && <p className="text-sm text-destructive font-bold mb-3">{error}</p>}

          <button
            type="button"
            onClick={handleSign}
            disabled={!agreed || submitting}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Signing…' : 'Sign Agreement'}
          </button>
        </div>
      </div>
    </div>
  )
}
