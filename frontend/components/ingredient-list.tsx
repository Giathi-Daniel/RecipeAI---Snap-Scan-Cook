type IngredientListProps = {
  ingredients: string[];
};

export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <ul className="space-y-3">
      {ingredients.map((ingredient) => (
        <li
          key={ingredient}
          className="rounded-2xl border border-sand bg-white/80 px-4 py-3 text-sm text-ink/80"
        >
          {ingredient}
        </li>
      ))}
    </ul>
  );
}
