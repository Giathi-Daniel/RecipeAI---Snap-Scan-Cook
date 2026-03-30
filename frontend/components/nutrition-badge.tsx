type NutritionBadgeProps = {
  label: string;
  value: string;
};

export function NutritionBadge({ label, value }: NutritionBadgeProps) {
  return (
    <div className="border-b border-sand/70 py-4 last:border-b-0">
      <div className="flex items-end justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
        <p className="font-display text-2xl text-ink">{value}</p>
      </div>
    </div>
  );
}
