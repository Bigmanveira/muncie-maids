import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import homeHero from '../assets/home-hero.webp'

const GUTTER_WIDTH = 'calc((100vw - 42rem) / 2)'

/** Wraps the four persistent tabs (Home, Bookings, Chat, Profile). The booking
 * funnel (Quote -> Pay) and auth/legal screens render full-screen without this shell.
 * BottomTabBar is reserved for a future dedicated mobile app — this web client uses
 * the top Navbar at every viewport size.
 *
 * At xl:+ the centered content column no longer sits in empty space: a static
 * home-cleaning photo fills each side gutter. Fixed in place (doesn't scroll
 * with the page) — every route wrapped by this shell keeps its content column
 * narrow with no opaque full-width background, so nothing hides it. */
export function TabShell() {
  return (
    <div className="min-h-dvh">
      <img
        src={homeHero}
        alt=""
        className="hidden xl:block fixed left-0 top-0 h-dvh object-cover -z-10 pointer-events-none"
        style={{ width: GUTTER_WIDTH }}
      />
      <img
        src={homeHero}
        alt=""
        className="hidden xl:block fixed right-0 top-0 h-dvh object-cover -z-10 pointer-events-none"
        style={{ width: GUTTER_WIDTH }}
      />
      <Navbar />
      <Outlet />
    </div>
  )
}
