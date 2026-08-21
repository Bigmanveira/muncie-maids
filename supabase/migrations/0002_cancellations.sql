-- Self-serve cancellation (product-plan-v2 §5.1, P0 addition to M1).
-- Policy: full refund at 24h+ before the visit, 50% retained inside 24h.
-- See DECISIONS.md for the owner decisions this encodes.

alter table bookings
  add column cancelled_at timestamptz,
  add column refund_amount numeric;
