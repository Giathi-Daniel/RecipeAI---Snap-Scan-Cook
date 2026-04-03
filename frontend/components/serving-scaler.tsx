type ServingScalerProps = {
  servings: number;
  minServings?: number;
  isPending?: boolean;
  onChange: (servings: number) => void;
};

export function ServingScaler({
  servings,
  minServings = 1,
  isPending = false,
  onChange,
}: ServingScalerProps) {
  return (
    <div className="flex items-center gap-3 rounded-[1.5rem] border border-sand bg-white/80 px-4 py-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(minServings, servings - 1))}
        disabled={isPending || servings <= minServings}
        className="grid h-9 w-9 place-items-center rounded-xl border border-sand bg-canvas text-lg text-ink"
      >
        -
      </button>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">
          Portions
        </div>
        <div className="mt-1 font-display text-2xl leading-none text-ink">{servings}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(servings + 1)}
        disabled={isPending}
        className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-lg text-white"
      >
        +
      </button>
    </div>
  );
}
