export function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <div className="flex text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < Math.round(rating)} />
        ))}
      </div>
      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{rating.toFixed(1)}</span>
      <span className="text-neutral-400 dark:text-neutral-500">({count.toLocaleString()})</span>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
      <path d="m12 3 2.7 5.9 6.3.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.3-.6L12 3Z" strokeLinejoin="round" />
    </svg>
  );
}
