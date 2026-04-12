export function RecipeCardSkeleton() {
  return (
    <div className="animate-pulse bg-sand rounded-lg p-4 shadow-card">
      <div className="h-48 bg-canvas rounded mb-4"></div>
      <div className="h-4 bg-canvas rounded mb-2"></div>
      <div className="h-4 bg-canvas rounded w-3/4 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-canvas rounded w-16"></div>
        <div className="h-6 bg-canvas rounded w-20"></div>
      </div>
      <div className="h-8 bg-canvas rounded w-24"></div>
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div className="animate-pulse max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 bg-sand rounded mb-4 w-3/4"></div>
      <div className="h-4 bg-sand rounded mb-8 w-1/2"></div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-64 bg-sand rounded"></div>
        <div className="space-y-4">
          <div className="h-6 bg-sand rounded w-32"></div>
          <div className="space-y-2">
            <div className="h-4 bg-sand rounded"></div>
            <div className="h-4 bg-sand rounded w-5/6"></div>
            <div className="h-4 bg-sand rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}