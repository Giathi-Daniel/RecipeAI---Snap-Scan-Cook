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
    <div className="flex items-center gap-2 border border-sand bg-white/80 px-3 py-2 sm:gap-3 sm:rounded-[1.5rem] sm:px-4 sm:py-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(minServings, servings - 1))}
        disabled={isPending || servings <= minServings}
        className="grid h-8 w-8 place-items-center border border-sand bg-canvas text-base text-ink sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg"
      >
        -
      </button>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/45 sm:text-[11px]">
          Portions
        </div>
        <div className="mt-1 font-display text-xl leading-none text-ink sm:text-2xl">{servings}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(servings + 1)}
        disabled={isPending}
        className="grid h-8 w-8 place-items-center bg-accent text-base text-white sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg"
      >
        +
      </button>
    </div>
  );
}
