import { useNavigate } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="border-t border-border mt-16 px-6 py-10">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-heading font-extrabold text-foreground">Muncie Maids</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-muted-foreground">
          <button type="button" onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
            Privacy Policy
          </button>
          <button type="button" onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">
            Terms of Service
          </button>
          <button type="button" onClick={() => navigate('/contact')} className="hover:text-foreground transition-colors">
            Contact
          </button>
        </div>
      </div>
      <p className="max-w-2xl mx-auto text-xs text-muted-foreground/70 mt-8">
        &copy; {new Date().getFullYear()} Muncie Maids. Serving Muncie, Yorktown, Gaston, and Albany, IN.
      </p>
    </footer>
  )
}
