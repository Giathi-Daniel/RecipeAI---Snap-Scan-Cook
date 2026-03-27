type RecipeCardProps = {
  title: string;
  description: string;
  tags?: string[];
};

export function RecipeCard({ title, description, tags = [] }: RecipeCardProps) {
  return (
    <article className="recipe-shell rounded-[2rem] border border-white/60 p-6 shadow-card">
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-herb/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-herb"
          >
            {tag}
          </span>
        ))}
      </div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink/70">{description}</p>
    </article>
  );
}
