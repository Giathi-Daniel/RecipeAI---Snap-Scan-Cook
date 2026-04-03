type IngredientListProps = {
  ingredients: Array<{
    quantity: string;
    unit: string | null;
    item: string;
  }>;
};

export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <ul className="divide-y divide-sand/70 rounded-[1.5rem] border border-sand/80 bg-white/80 px-5">
      {ingredients.map((ingredient, index) => (
        <li
          key={`${ingredient.item}-${index}`}
          className="flex gap-4 py-4 text-sm text-ink/80"
        >
          <span className="mt-0.5 w-6 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-ink/35">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>
            <span className="font-semibold text-ink">{ingredient.quantity}</span>
            {ingredient.unit ? ` ${ingredient.unit}` : ""} {ingredient.item}
          </span>
        </li>
      ))}
    </ul>
  );
}
