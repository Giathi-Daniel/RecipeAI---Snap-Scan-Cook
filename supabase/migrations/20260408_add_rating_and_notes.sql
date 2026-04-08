-- Add rating and notes columns to saved_recipes table
ALTER TABLE saved_recipes
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add notes column for personal cooking notes
ALTER TABLE saved_recipes
ADD COLUMN notes TEXT;

-- Add index for filtering by rating
CREATE INDEX idx_saved_recipes_rating ON saved_recipes(rating);

-- Add updated_at column to track when notes/rating were last modified
ALTER TABLE saved_recipes
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_saved_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_recipes_updated_at
    BEFORE UPDATE ON saved_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_recipes_updated_at();

-- Add comment for documentation
COMMENT ON COLUMN saved_recipes.rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN saved_recipes.notes IS 'Personal cooking notes and modifications';
COMMENT ON COLUMN saved_recipes.updated_at IS 'Timestamp of last rating/notes update';
