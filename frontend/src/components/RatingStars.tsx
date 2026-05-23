interface RatingStarsProps {
  value: number;
}

export default function RatingStars({ value }: RatingStarsProps) {
  const fullStars = Math.floor(value);
  const half = value - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-1 text-sm text-rose-500">
      {[...Array(fullStars)].map((_, index) => (
        <span key={index}>★</span>
      ))}
      {half && <span>☆</span>}
      <span className="text-slate-500 ml-2">{value.toFixed(1)}</span>
    </div>
  );
}
