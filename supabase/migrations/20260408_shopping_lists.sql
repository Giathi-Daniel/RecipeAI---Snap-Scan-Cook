-- Shopping Lists Feature
-- Migration: 20260408_shopping_lists.sql

-- Create shopping_lists table
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping_list_items table
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    unit TEXT,
    category TEXT,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping_list_recipes junction table
CREATE TABLE shopping_list_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shopping_list_id, recipe_id)
);

-- Add indexes for performance
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_category ON shopping_list_items(category);
CREATE INDEX idx_shopping_list_recipes_list_id ON shopping_list_recipes(shopping_list_id);
CREATE INDEX idx_shopping_list_recipes_recipe_id ON shopping_list_recipes(recipe_id);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_lists
CREATE POLICY shopping_lists_select_own
    ON shopping_lists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY shopping_lists_insert_own
    ON shopping_lists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY shopping_lists_update_own
    ON shopping_lists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY shopping_lists_delete_own
    ON shopping_lists FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for shopping_list_items
CREATE POLICY shopping_list_items_select_own
    ON shopping_list_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY shopping_list_items_insert_own
    ON shopping_list_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY shopping_list_items_update_own
    ON shopping_list_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY shopping_list_items_delete_own
    ON shopping_list_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- RLS Policies for shopping_list_recipes
CREATE POLICY shopping_list_recipes_select_own
    ON shopping_list_recipes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_recipes.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY shopping_list_recipes_insert_own
    ON shopping_list_recipes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_recipes.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY shopping_list_recipes_delete_own
    ON shopping_list_recipes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_list_recipes.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- Trigger to update shopping_lists.updated_at
CREATE OR REPLACE FUNCTION update_shopping_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shopping_lists_updated_at
    BEFORE UPDATE ON shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_lists_updated_at();

-- Comments for documentation
COMMENT ON TABLE shopping_lists IS 'User shopping lists generated from recipes';
COMMENT ON TABLE shopping_list_items IS 'Individual items in a shopping list with quantities';
COMMENT ON TABLE shopping_list_recipes IS 'Junction table linking shopping lists to recipes';
COMMENT ON COLUMN shopping_list_items.checked IS 'Whether item has been purchased';
COMMENT ON COLUMN shopping_list_items.category IS 'Ingredient category (produce, dairy, pantry, etc.)';
