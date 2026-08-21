-- PLACEHOLDER — replace with owner's real rates before launch.
-- These values are tuned only to land a typical 3bd/2ba standard,
-- one-time clean (1000-1800 sqft band) at $137 - inside the
-- $120-$180 target range from the build brief. Every other
-- combination is a mechanical consequence of this formula, not a
-- verified real-world price point.
insert into pricing_config (
  id, base_price, per_bedroom, per_bathroom,
  sqft_band_multipliers, clean_type_multipliers, frequency_discounts
) values (
  1,
  59,   -- PLACEHOLDER base callout fee
  14,   -- PLACEHOLDER per bedroom
  9,    -- PLACEHOLDER per bathroom
  '{"under_1000": 1.0, "1000_1800": 1.15, "1800_2600": 1.35, "2600_plus": 1.6}'::jsonb,
  '{"standard": 1.0, "deep": 1.5, "moveout": 1.75}'::jsonb,
  '{"one_time": 0, "weekly": 0.20, "biweekly": 0.15, "monthly": 0.10}'::jsonb
)
on conflict (id) do update set
  base_price = excluded.base_price,
  per_bedroom = excluded.per_bedroom,
  per_bathroom = excluded.per_bathroom,
  sqft_band_multipliers = excluded.sqft_band_multipliers,
  clean_type_multipliers = excluded.clean_type_multipliers,
  frequency_discounts = excluded.frequency_discounts;

-- Delaware County, Indiana service area. zip_prefixes are matched by
-- exact zip in M1 (Delaware County zips don't need true prefix
-- matching); the column is named for future expansion into
-- surrounding counties where prefix matching would help.
insert into service_areas (city, zip_prefixes, active) values
  ('Muncie',   array['47303', '47304', '47305', '47306', '47307', '47308'], true),
  ('Yorktown', array['47396'], true),
  ('Gaston',   array['47342'], true),
  ('Albany',   array['47320'], true)
on conflict do nothing;
