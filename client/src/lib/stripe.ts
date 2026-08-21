import { loadStripe } from '@stripe/stripe-js'

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const isStripeConfigured = Boolean(key)

export const stripePromise = key ? loadStripe(key) : Promise.resolve(null)
