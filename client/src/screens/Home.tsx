import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { StepCard } from '../components/StepCard'
import { Footer } from '../components/Footer'
import { ScrollReveal } from '../components/ScrollReveal'
import { useAuth } from '../context/AuthContext'
import { useBookingModal } from '../context/BookingModalContext'
import { useDetectedLocation } from '../lib/useDetectedLocation'
import { STEPS } from '../lib/howItWorks'
import { REVIEWS } from '../lib/reviews'
import homeHero from '../assets/home-hero.webp'
import givesBackImage from '../assets/gives-back.webp'

const STEP_AUTO_ADVANCE_MS = 3200
const HERO_AUTO_ADVANCE_MS = 5000
const REVIEW_AUTO_ADVANCE_MS = 4500

const HERO_SLIDES = [
  {
    id: 'instant-price',
    image: homeHero,
    alt: 'A tidy, sunlit living room after a Muncie Maids cleaning visit',
    badgeIcon: 'ph:star-fill',
    badgeIconClass: 'text-chart-4',
    badgeLabel: '4.9/5 Rating',
    badgeSub: 'in Delaware County',
    heading: 'Professional home cleaning, made simple',
    body: 'Tell us about your home and get an instant price. No quotes, no callbacks.',
  },
  {
    id: 'gives-back',
    image: givesBackImage,
    alt: 'A bright, plant-filled living room cared for with eco-friendly products',
    badgeIcon: 'solar:leaf-bold',
    badgeIconClass: 'text-chart-3',
    badgeLabel: 'Eco-Friendly, Local Impact',
    badgeSub: undefined as string | undefined,
    heading: 'Cleaning that gives back',
    body: 'Eco-friendly, biodegradable products on every visit — plus a share of each booking funds local park and creek clean-ups.',
  },
]

/** Auto-advancing, swipeable carousel state — shared by the hero, steps, and reviews carousels. */
function useSwipeCarousel(length: number, autoAdvanceMs: number) {
  const [active, setActive] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % length)
    }, autoAdvanceMs)
    return () => clearInterval(timer)
  }, [active, length, autoAdvanceMs])

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchStartX.current == null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      setActive((prev) => (deltaX < 0 ? (prev + 1) % length : (prev - 1 + length) % length))
    }
    touchStartX.current = null
  }

  return { active, setActive, onTouchStart, onTouchEnd }
}

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openBookingModal } = useBookingModal()
  const firstName = user?.name.split(' ')[0]
  const location = useDetectedLocation()
  const hero = useSwipeCarousel(HERO_SLIDES.length, HERO_AUTO_ADVANCE_MS)
  const steps = useSwipeCarousel(STEPS.length, STEP_AUTO_ADVANCE_MS)
  const reviews = useSwipeCarousel(REVIEWS.length, REVIEW_AUTO_ADVANCE_MS)

  return (
    <div className="max-w-2xl mx-auto">
      {user && (
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 text-left px-6 pt-8 pb-4"
        >
          <Avatar name={user.name} photoUrl={user.homeProfile.avatarDataUrl} size={44} />
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Welcome back</p>
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-foreground">{firstName}</span>
              <Icon icon="solar:alt-arrow-down-linear" className="text-xs text-muted-foreground" />
            </div>
          </div>
        </button>
      )}

      <div className={`px-6 space-y-8 ${user ? '' : 'pt-8'}`}>
        <div>
          <button
            type="button"
            onClick={location.detect}
            disabled={location.detecting}
            className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            <Icon icon={location.detected ? 'solar:map-point-bold' : 'solar:map-point-linear'} className="text-secondary text-xl shrink-0" />
            {location.detecting ? (
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            ) : (
              <span className="flex-1 text-muted-foreground font-medium">{location.label}</span>
            )}
            <Icon icon="solar:refresh-linear" className="text-muted-foreground/50 text-base shrink-0" />
          </button>
          {location.hint && <p className="text-xs text-muted-foreground mt-2 ml-1 leading-relaxed">{location.hint}</p>}
        </div>

        <ScrollReveal>
          <section
            className="relative rounded-[32px] overflow-hidden bg-card border border-border shadow-sm"
            onTouchStart={hero.onTouchStart}
            onTouchEnd={hero.onTouchEnd}
          >
            <div className="h-56 overflow-hidden">
              <img
                key={hero.active}
                src={HERO_SLIDES[hero.active].image}
                alt={HERO_SLIDES[hero.active].alt}
                className="w-full h-56 object-cover carousel-fade"
                loading={hero.active === 0 ? 'eager' : 'lazy'}
              />
            </div>
            <div className="p-6 pb-4">
              <div key={hero.active} className="carousel-fade min-h-[168px] sm:min-h-[148px]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Icon icon={HERO_SLIDES[hero.active].badgeIcon} className={HERO_SLIDES[hero.active].badgeIconClass} />
                  <span className="text-sm font-bold text-foreground">{HERO_SLIDES[hero.active].badgeLabel}</span>
                  {HERO_SLIDES[hero.active].badgeSub && (
                    <span className="text-xs text-muted-foreground ml-1">{HERO_SLIDES[hero.active].badgeSub}</span>
                  )}
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-3 leading-tight">
                  {HERO_SLIDES[hero.active].heading}
                </h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {HERO_SLIDES[hero.active].body}
                </p>
              </div>
              <button
                type="button"
                onClick={openBookingModal}
                className="w-full bg-primary text-primary-foreground font-bold py-4.5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Book Now
              </button>
            </div>
            <div className="flex justify-center gap-1.5 pb-5">
              {HERO_SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => hero.setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${i === hero.active ? 'w-4 bg-primary' : 'w-1.5 bg-secondary/20'}`}
                />
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <div className="bg-card rounded-[28px] p-6 shadow-sm border border-border flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-secondary/5 flex items-center justify-center">
              <Icon icon="solar:shield-check-bold" className="text-secondary text-3xl" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg leading-tight">{location.town} Trusted</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Background-checked and insured, local cleaning teams.</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <section id="how-it-works" className="scroll-mt-24">
            <h2 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
              How it works
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </h2>
            {/* Mobile: one card at a time, auto-advancing */}
            <div className="sm:hidden" onTouchStart={steps.onTouchStart} onTouchEnd={steps.onTouchEnd}>
              <StepCard key={STEPS[steps.active].n} step={STEPS[steps.active]} />
              <div className="flex justify-center gap-1.5 mt-4">
                {STEPS.map((step, i) => (
                  <button
                    key={step.n}
                    type="button"
                    aria-label={`Go to step ${i + 1}`}
                    onClick={() => steps.setActive(i)}
                    className={`h-1.5 rounded-full transition-all ${i === steps.active ? 'w-4 bg-primary' : 'w-1.5 bg-secondary/20'}`}
                  />
                ))}
              </div>
            </div>

            {/* Tablet/desktop: all three at once */}
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4">
              {STEPS.map((step) => (
                <StepCard key={step.n} step={step} />
              ))}
            </div>

            <button
              type="button"
              onClick={openBookingModal}
              className="w-full mt-5 bg-primary text-primary-foreground font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              Book Now
            </button>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section id="reviews" className="scroll-mt-24">
            <h2 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
              What Delaware County families say
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </h2>
            <div onTouchStart={reviews.onTouchStart} onTouchEnd={reviews.onTouchEnd}>
              <div className="bg-card rounded-[24px] p-5 border border-border shadow-sm">
                <div key={reviews.active} className="carousel-fade min-h-[132px]">
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Icon key={s} icon="ph:star-fill" className={s < REVIEWS[reviews.active].rating ? 'text-chart-4' : 'text-muted'} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">&ldquo;{REVIEWS[reviews.active].quote}&rdquo;</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {REVIEWS[reviews.active].name} &middot; {REVIEWS[reviews.active].town}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-1.5 mt-4">
                {REVIEWS.map((review, i) => (
                  <button
                    key={review.id}
                    type="button"
                    aria-label={`Go to review ${i + 1}`}
                    onClick={() => reviews.setActive(i)}
                    className={`h-1.5 rounded-full transition-all ${i === reviews.active ? 'w-4 bg-primary' : 'w-1.5 bg-secondary/20'}`}
                  />
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>

      <Footer />
    </div>
  )
}
