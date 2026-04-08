"use client";

import { useState } from "react";

type StarRatingProps = {
  rating: number | null;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

export function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(null)}
          disabled={readonly}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <svg
            className={`${sizeClasses[size]} transition-colors ${
              star <= displayRating
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-ink/20"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
      {rating && !readonly && (
        <button
          type="button"
          onClick={() => onRatingChange(0)}
          className="ml-2 text-xs font-semibold uppercase tracking-wider text-ink/50 transition hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
