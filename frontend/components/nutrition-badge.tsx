type NutritionBadgeProps = {
  label: string;
  value: string;
};

export function NutritionBadge({ label, value }: NutritionBadgeProps) {
  return (
    <div className="rounded-2xl border border-sand bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
