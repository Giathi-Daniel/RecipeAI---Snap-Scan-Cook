import test from "node:test";
import assert from "node:assert/strict";

import {
  collectDashboardFilters,
  filterDashboardRecipes,
  type DashboardRecipe,
} from "../lib/dashboard";

const recipes: DashboardRecipe[] = [
  {
    savedRecipeId: "saved-1",
    recipeId: "recipe-1",
    title: "Braised Coconut Chicken",
    description: "Creamy weeknight chicken.",
    imageUrl: null,
    servings: 4,
    tags: ["high-protein", "comfort-food"],
    dietaryFlags: ["Gluten-Free"],
    ingredients: [
      { quantity: "1", unit: "cup", item: "coconut milk" },
      { quantity: "1", unit: null, item: "whole chicken" },
    ],
    savedAt: "2026-04-07T10:00:00.000Z",
  },
  {
    savedRecipeId: "saved-2",
    recipeId: "recipe-2",
    title: "Vegetable Pilau",
    description: "Fragrant rice with vegetables.",
    imageUrl: null,
    servings: 6,
    tags: ["vegetarian", "rice"],
    dietaryFlags: ["Dairy-Free"],
    ingredients: [{ quantity: "2", unit: "cups", item: "basmati rice" }],
    savedAt: "2026-04-06T10:00:00.000Z",
  },
];

test("filterDashboardRecipes matches ingredient names and tags", () => {
  assert.equal(filterDashboardRecipes(recipes, "coconut").length, 1);
  assert.equal(filterDashboardRecipes(recipes, "vegetarian")[0]?.title, "Vegetable Pilau");
});

test("filterDashboardRecipes returns all recipes for empty query", () => {
  assert.equal(filterDashboardRecipes(recipes, " ").length, 2);
});

test("collectDashboardFilters merges tags and dietary flags", () => {
  assert.deepEqual(collectDashboardFilters(recipes), [
    "comfort-food",
    "Dairy-Free",
    "Gluten-Free",
    "high-protein",
    "rice",
    "vegetarian",
  ]);
});
