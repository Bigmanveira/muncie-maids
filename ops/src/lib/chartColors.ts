// Chart-specific colors, validated for colorblind-safety and contrast
// against a white chart surface (see dataviz skill's validate_palette.js).
// The app's own brand hues (coral/navy/gold/green/indigo) failed that
// validation as a categorical set — too clustered by warmth/hue family for
// safe adjacent-pair separation — so status colors use the skill's
// pre-validated reference steps instead. Single-hue charts (one bar color,
// no adjacency to worry about) still use the brand secondary/primary.

export const STATUS_CHART_COLOR: Record<string, string> = {
  completed: '#0ca30c', // good
  active: '#2a78d6', // in progress — neutral blue, not a status-palette slot
  needs_ops: '#d03b3b', // critical
  pending_payment: '#fab219', // warning
  cancelled: '#898781', // muted — inactive, not urgent
}

export const STATUS_CHART_LABEL: Record<string, string> = {
  completed: 'Completed',
  active: 'Active (open/claimed)',
  needs_ops: 'Needs ops',
  pending_payment: 'Pending payment',
  cancelled: 'Cancelled',
}

export const STATUS_CHART_ICON: Record<string, string> = {
  completed: 'solar:check-circle-bold',
  active: 'solar:clock-circle-bold',
  needs_ops: 'solar:siren-bold',
  pending_payment: 'solar:hourglass-bold',
  cancelled: 'solar:close-circle-bold',
}
