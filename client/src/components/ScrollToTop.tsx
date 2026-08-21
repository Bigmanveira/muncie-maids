import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router doesn't reset scroll position on navigation — without this, a screen
 * can open already scrolled partway down if the previous screen was scrolled too.
 * A hash (e.g. /home#reviews) scrolls to that element instead of the top. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
