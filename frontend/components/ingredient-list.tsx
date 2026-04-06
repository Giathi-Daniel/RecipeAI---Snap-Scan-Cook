type IngredientListProps = {
  ingredients: Array<{
    quantity: string;
    unit: string | null;
    item: string;
  }>;
  onSubstitute?: (index: number) => void;
  substituteBusyIndex?: number | null;
};

export function IngredientList({
  ingredients,
  onSubstitute,
  substituteBusyIndex = null,
}: IngredientListProps) {
  return (
    <ul className="divide-y divide-sand/70 rounded-[1.5rem] border border-sand/80 bg-white/80 px-5">
      {ingredients.map((ingredient, index) => (
        <li
          key={`${ingredient.item}-${index}`}
          className="flex flex-col gap-3 py-4 text-sm text-ink/80 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex gap-4">
            <span className="mt-0.5 w-6 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-ink/35">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="font-semibold text-ink">{ingredient.quantity}</span>
              {ingredient.unit ? ` ${ingredient.unit}` : ""} {ingredient.item}
            </span>
          </div>
          {onSubstitute ? (
            <button
              type="button"
              onClick={() => onSubstitute(index)}
              disabled={substituteBusyIndex === index}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accentDark transition hover:border-accent/40 hover:bg-accent/15 disabled:cursor-wait disabled:opacity-60"
            >
              {substituteBusyIndex === index ? "Finding swaps..." : "Substitute"}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
