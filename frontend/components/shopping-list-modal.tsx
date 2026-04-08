"use client";

import { useState } from "react";
import { aggregateIngredients, groupByCategory } from "@/lib/shopping-list";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AggregatedIngredient = {
  name: string;
  quantity: string;
  unit: string | null;
  category: string;
  originalQuantities: string[];
};

type ShoppingListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRecipes: Array<{
    recipeId: string;
    title: string;
    ingredients: Array<{
      quantity: string;
      unit: string | null;
      item: string;
    }>;
  }>;
};

export function ShoppingListModal({ isOpen, onClose, selectedRecipes }: ShoppingListModalProps) {
  const [listName, setListName] = useState("My Shopping List");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const aggregated = aggregateIngredients(selectedRecipes);
  const grouped = groupByCategory(aggregated);

  function toggleItem(itemKey: string) {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemKey)) {
      newChecked.delete(itemKey);
    } else {
      newChecked.add(itemKey);
    }
    setCheckedItems(newChecked);
  }

  async function handleSave() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in to save shopping lists");
        return;
      }

      // Create shopping list
      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name: listName })
        .select()
        .single();

      if (listError) throw listError;

      // Add items
      const items = aggregated.map((item) => ({
        shopping_list_id: list.id,
        ingredient_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: checkedItems.has(`${item.name}|${item.unit}`),
      }));

      const { error: itemsError } = await supabase
        .from("shopping_list_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // Link recipes
      const recipeLinks = selectedRecipes.map((recipe) => ({
        shopping_list_id: list.id,
        recipe_id: recipe.recipeId,
      }));

      const { error: recipesError } = await supabase
        .from("shopping_list_recipes")
        .insert(recipeLinks);

      if (recipesError) throw recipesError;

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shopping list");
    } finally {
      setIsSaving(false);
    }
  }

  function handleExport() {
    let text = `${listName}\n\n`;
    text += `Recipes: ${selectedRecipes.map((r) => r.title).join(", ")}\n\n`;

    Object.entries(grouped).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      items.forEach((item) => {
        const checked = checkedItems.has(`${item.name}|${item.unit}`) ? "✓" : "☐";
        const unit = item.unit ? ` ${item.unit}` : "";
        text += `${checked} ${item.quantity}${unit} ${item.name}\n`;
      });
      text += "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden border border-sand bg-white">
        <div className="border-b border-sand px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink">Shopping List</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-ink/50 transition hover:text-ink"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-ink/70">
            {selectedRecipes.length} recipe{selectedRecipes.length > 1 ? "s" : ""} • {aggregated.length} ingredient{aggregated.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>
          <div className="mb-5">
            <label className="block text-sm font-semibold uppercase tracking-wider text-ink/55">
              List Name
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="mt-2 w-full border border-sand bg-canvas px-4 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/55">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const itemKey = `${item.name}|${item.unit}`;
                  const isChecked = checkedItems.has(itemKey);
                  return (
                    <label
                      key={itemKey}
                      className="flex items-center gap-3 border border-sand bg-white px-4 py-3 transition hover:bg-canvas"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(itemKey)}
                        className="h-4 w-4"
                      />
                      <span className={`flex-1 text-sm ${isChecked ? "text-ink/50 line-through" : "text-ink"}`}>
                        {item.quantity} {item.unit || ""} {item.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {error && (
            <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-sand px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-sm border border-ink bg-ink px-5 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save List"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-sm border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Export as Text
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-sand bg-white px-5 py-3 text-sm font-semibold text-ink/70 transition hover:border-ink hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
