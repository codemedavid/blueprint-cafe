/*
  # Add type column to variations table

  Adds a `type` column to the `variations` table to support grouping variations
  by type (e.g., "Size", "Temperature", "Sugar Level").

  Existing variations without a type are backfilled with 'Variation' as the default.
*/

-- Add type column (nullable to allow existing rows without a value)
ALTER TABLE variations ADD COLUMN IF NOT EXISTS type TEXT;

-- Backfill existing rows: set type = 'Variation' where type is NULL
UPDATE variations SET type = 'Variation' WHERE type IS NULL;
