type ServingScalerProps = {
  servings: number;
};

export function ServingScaler({ servings }: ServingScalerProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-sand bg-white/80 px-4 py-2">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-sand text-lg text-ink"
      >
        -
      </button>
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/70">
        {servings} Servings
      </div>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-accent text-lg text-white"
      >
        +
      </button>
    </div>
  );
}
