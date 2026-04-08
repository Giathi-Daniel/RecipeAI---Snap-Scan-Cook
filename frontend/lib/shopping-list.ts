// Ingredient aggregation and categorization utilities

type Ingredient = {
  quantity: string;
  unit: string | null;
  item: string;
};

type AggregatedIngredient = {
  name: string;
  quantity: string;
  unit: string | null;
  category: string;
  originalQuantities: string[];
};

// Common unit conversions to base units
const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  // Volume
  "cup": { base: "cup", factor: 1 },
  "cups": { base: "cup", factor: 1 },
  "tablespoon": { base: "tablespoon", factor: 1 },
  "tablespoons": { base: "tablespoon", factor: 1 },
  "tbsp": { base: "tablespoon", factor: 1 },
  "teaspoon": { base: "teaspoon", factor: 1 },
  "teaspoons": { base: "teaspoon", factor: 1 },
  "tsp": { base: "teaspoon", factor: 1 },
  "ml": { base: "ml", factor: 1 },
  "liter": { base: "ml", factor: 1000 },
  "liters": { base: "ml", factor: 1000 },
  "l": { base: "ml", factor: 1000 },
  
  // Weight
  "gram": { base: "gram", factor: 1 },
  "grams": { base: "gram", factor: 1 },
  "g": { base: "gram", factor: 1 },
  "kg": { base: "gram", factor: 1000 },
  "kilogram": { base: "gram", factor: 1000 },
  "kilograms": { base: "gram", factor: 1000 },
  "oz": { base: "oz", factor: 1 },
  "ounce": { base: "oz", factor: 1 },
  "ounces": { base: "oz", factor: 1 },
  "lb": { base: "oz", factor: 16 },
  "pound": { base: "oz", factor: 16 },
  "pounds": { base: "oz", factor: 16 },
};

// Ingredient categories for grouping
const INGREDIENT_CATEGORIES: Record<string, string> = {
  // Produce
  "tomato": "produce",
  "onion": "produce",
  "garlic": "produce",
  "potato": "produce",
  "carrot": "produce",
  "lettuce": "produce",
  "spinach": "produce",
  "pepper": "produce",
  "cucumber": "produce",
  "avocado": "produce",
  "lemon": "produce",
  "lime": "produce",
  "apple": "produce",
  "banana": "produce",
  
  // Dairy
  "milk": "dairy",
  "cheese": "dairy",
  "butter": "dairy",
  "cream": "dairy",
  "yogurt": "dairy",
  "egg": "dairy",
  
  // Meat & Seafood
  "chicken": "meat",
  "beef": "meat",
  "pork": "meat",
  "fish": "seafood",
  "salmon": "seafood",
  "shrimp": "seafood",
  "tuna": "seafood",
  
  // Pantry
  "flour": "pantry",
  "sugar": "pantry",
  "salt": "pantry",
  "black pepper": "pantry",
  "oil": "pantry",
  "rice": "pantry",
  "pasta": "pantry",
  "beans": "pantry",
  "lentils": "pantry",
};

function parseQuantity(quantity: string): number | null {
  // Handle fractions like "1/2", "1 1/2"
  const fractionMatch = quantity.match(/(\d+)?\s*(\d+)\/(\d+)/);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1]) : 0;
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    return whole + numerator / denominator;
  }

  // Handle decimals and whole numbers
  const number = parseFloat(quantity);
  return isNaN(number) ? null : number;
}

function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  const normalized = unit.toLowerCase().trim();
  return UNIT_CONVERSIONS[normalized]?.base || normalized;
}

function categorizeIngredient(ingredientName: string): string {
  const normalized = ingredientName.toLowerCase();
  
  for (const [keyword, category] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }
  
  return "other";
}

function normalizeIngredientName(name: string): string {
  // Remove common prep instructions and normalize
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // Remove parentheses
    .replace(/,.*$/, "") // Remove everything after comma
    .replace(/\s+/g, " ")
    .trim();
}

export function aggregateIngredients(recipes: Array<{ ingredients: Ingredient[] }>): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const normalizedName = normalizeIngredientName(ingredient.item);
      const normalizedUnit = normalizeUnit(ingredient.unit);
      const key = `${normalizedName}|${normalizedUnit || "none"}`;

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        const existingQty = parseQuantity(existing.quantity);
        const newQty = parseQuantity(ingredient.quantity);

        if (existingQty !== null && newQty !== null) {
          const total = existingQty + newQty;
          existing.quantity = formatQuantity(total);
          existing.originalQuantities.push(ingredient.quantity);
        } else {
          // Can't aggregate, keep as separate entry
          existing.originalQuantities.push(ingredient.quantity);
        }
      } else {
        ingredientMap.set(key, {
          name: ingredient.item,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: categorizeIngredient(ingredient.item),
          originalQuantities: [ingredient.quantity],
        });
      }
    });
  });

  return Array.from(ingredientMap.values());
}

function formatQuantity(num: number): string {
  // Convert to fraction if close to common fractions
  const fractions: [number, string][] = [
    [0.125, "1/8"],
    [0.25, "1/4"],
    [0.333, "1/3"],
    [0.5, "1/2"],
    [0.666, "2/3"],
    [0.75, "3/4"],
  ];

  const whole = Math.floor(num);
  const decimal = num - whole;

  for (const [value, fraction] of fractions) {
    if (Math.abs(decimal - value) < 0.05) {
      return whole > 0 ? `${whole} ${fraction}` : fraction;
    }
  }

  // Return as decimal if not a common fraction
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
}

export function groupByCategory(ingredients: AggregatedIngredient[]): Record<string, AggregatedIngredient[]> {
  const grouped: Record<string, AggregatedIngredient[]> = {
    produce: [],
    dairy: [],
    meat: [],
    seafood: [],
    pantry: [],
    other: [],
  };

  ingredients.forEach((ingredient) => {
    const category = ingredient.category;
    if (grouped[category]) {
      grouped[category].push(ingredient);
    } else {
      grouped.other.push(ingredient);
    }
  });

  // Remove empty categories
  Object.keys(grouped).forEach((key) => {
    if (grouped[key].length === 0) {
      delete grouped[key];
    }
  });

  return grouped;
}

export function formatShoppingList(grouped: Record<string, AggregatedIngredient[]>): string {
  let output = "SHOPPING LIST\n\n";

  Object.entries(grouped).forEach(([category, items]) => {
    output += `${category.toUpperCase()}\n`;
    items.forEach((item) => {
      const unit = item.unit ? ` ${item.unit}` : "";
      output += `☐ ${item.quantity}${unit} ${item.name}\n`;
    });
    output += "\n";
  });

  return output;
}
