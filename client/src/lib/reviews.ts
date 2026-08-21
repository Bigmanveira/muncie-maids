export interface Review {
  id: string
  name: string
  town: string
  rating: 1 | 2 | 3 | 4 | 5
  quote: string
}

/** Placeholder reviews until real customer quotes are supplied — swap this array when they're ready. */
export const REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Sarah M.',
    town: 'Muncie',
    rating: 5,
    quote: 'Booked online in under two minutes and the team showed up right on time. My kitchen has never looked better.',
  },
  {
    id: '2',
    name: 'David R.',
    town: 'Yorktown',
    rating: 5,
    quote: 'Same cleaner every visit, always thorough. Having a set biweekly schedule takes one thing off my plate for good.',
  },
  {
    id: '3',
    name: 'Priya K.',
    town: 'Muncie',
    rating: 4,
    quote: 'Instant pricing meant no back-and-forth quotes. Straightforward and the results speak for themselves.',
  },
  {
    id: '4',
    name: 'Tom W.',
    town: 'Gaston',
    rating: 5,
    quote: 'Background-checked and insured gave us real peace of mind letting someone into our home while we were at work.',
  },
  {
    id: '5',
    name: 'Angela F.',
    town: 'Albany',
    rating: 5,
    quote: 'Rescheduling around our travel was painless through the app. Easily the most reliable cleaning service we’ve used.',
  },
]
