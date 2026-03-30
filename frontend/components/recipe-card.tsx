type RecipeCardProps = {
  title: string;
  description: string;
  tags?: string[];
};

export function RecipeCard({ title, description, tags = [] }: RecipeCardProps) {
  return (
    <article className="recipe-shell rounded-[2rem] border border-white/60 p-6 shadow-card">
      {tags.length ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">
          {tags.map((tag, index) => (
            <div key={tag} className="flex items-center gap-3">
              {index > 0 ? <span className="h-px w-6 bg-sand" /> : null}
              <span>{tag}</span>
            </div>
          ))}
        </div>
      ) : null}
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink/70">{description}</p>
    </article>
  );
}
