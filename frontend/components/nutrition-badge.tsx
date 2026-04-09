type NutritionBadgeProps = {
  label: string;
  value: string;
};

export function NutritionBadge({ label, value }: NutritionBadgeProps) {
  return (
    <div className="rounded-[1.25rem] border border-sand/70 bg-canvas/75 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-3 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
