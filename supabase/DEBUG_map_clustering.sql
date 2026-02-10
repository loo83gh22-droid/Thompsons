-- DEBUG: Map clustering uses travel_locations.location_cluster_id (not journal_entries)
-- Run these in Supabase SQL Editor to see why a cluster might show only 1 entry.

-- 1) All travel_locations that mention Uvita (or any location)
SELECT
  id,
  location_name,
  lat,
  lng,
  trip_date,
  notes,
  location_cluster_id,
  journal_entry_id
FROM travel_locations
WHERE location_name ILIKE '%Uvita%'
ORDER BY trip_date DESC NULLS LAST;

-- 2) location_clusters for that area
SELECT
  id,
  location_name,
  latitude,
  longitude,
  entry_count,
  date_range_start,
  date_range_end
FROM location_clusters
WHERE location_name ILIKE '%Uvita%';

-- 3) How many travel_locations per cluster (should be 3 for Uvita if clustering worked)
SELECT
  lc.location_name,
  lc.entry_count AS claimed_count,
  COUNT(tl.id) AS actual_pins,
  array_agg(tl.notes ORDER BY tl.trip_date DESC NULLS LAST) AS entry_titles
FROM location_clusters lc
LEFT JOIN travel_locations tl ON tl.location_cluster_id = lc.id
WHERE lc.location_name ILIKE '%Uvita%'
GROUP BY lc.id, lc.location_name, lc.entry_count;

-- If actual_pins = 1 but you have 3 Uvita entries: run "Rebuild clusters" on the map page.
-- If some pins have location_cluster_id NULL, the rebuild will assign them to the same cluster.
