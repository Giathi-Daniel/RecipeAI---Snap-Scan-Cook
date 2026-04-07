type RecipeCardProps = {
  title: string;
  description: string;
  imageUrl?: string | null;
  tags?: string[];
  servings?: number | null;
  ingredients?: Array<{
    quantity: string;
    unit: string | null;
    item: string;
  }>;
  steps?: Array<{
    order: number;
    instruction: string;
  }>;
  footer?: React.ReactNode;
};

export function RecipeCard({
  title,
  description,
  imageUrl,
  tags = [],
  servings,
  ingredients = [],
  steps = [],
  footer,
}: RecipeCardProps) {
  return (
    <article className="recipe-shell border border-sand p-6">
      <div className="mb-5 overflow-hidden border border-sand">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 items-end bg-canvas p-5">
            <div className="border border-sand bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
                Saved recipe
              </p>
              <p className="mt-2 max-w-[12rem] font-display text-2xl leading-tight text-ink">
                {title}
              </p>
            </div>
          </div>
        )}
      </div>
      {tags.length || servings ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">
          {servings ? <span>Serves {servings}</span> : null}
          {tags.map((tag, index) => (
            <div key={tag} className="flex items-center gap-3">
              {index > 0 || servings ? <span className="h-px w-6 bg-sand" /> : null}
              <span>{tag}</span>
            </div>
          ))}
        </div>
      ) : null}
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink/70">{description}</p>

      {ingredients.length ? (
        <section className="mt-6 border border-sand bg-canvas p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/55">
            Ingredients
          </h4>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
            {ingredients.map((ingredient, index) => (
              <li key={`${ingredient.item}-${index}`} className="flex gap-3">
                <span className="w-6 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-ink/35">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="font-semibold text-ink">{ingredient.quantity}</span>
                  {ingredient.unit ? ` ${ingredient.unit}` : ""} {ingredient.item}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {steps.length ? (
        <section className="mt-5 border border-sand bg-white p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/55">Method</h4>
          <ol className="mt-4 space-y-4">
            {steps.map((step) => (
              <li key={`${step.order}-${step.instruction}`} className="flex gap-3">
                <span className="w-6 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-ink/35">
                  {String(step.order).padStart(2, "0")}
                </span>
                <p className="text-sm leading-6 text-ink/80">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {footer ? <div className="mt-6">{footer}</div> : null}
    </article>
  );
}
