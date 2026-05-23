import type { TripBoard } from '../types';
import Tag from './Tag';

interface TripGridProps {
  boards: TripBoard[];
}

export default function TripGrid({ boards }: TripGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {boards.map((board) => (
        <article
          key={board.id}
          className="group cursor-pointer overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img
              src={board.cover}
              alt={board.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <button
              type="button"
              aria-label="Save board"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow transition group-hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
          <div className="mt-3 space-y-1 px-0.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-slate-900">{board.title}</h2>
              <span className="shrink-0 text-sm text-slate-600">★ 4.9</span>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2">{board.description}</p>
            <p className="text-sm font-medium text-slate-900">
              <span className="font-semibold">{board.places.length} spots</span>
              <span className="text-slate-500"> · curated board</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {board.places.slice(0, 3).map((place) => (
                <Tag key={place.id} label={place.category} />
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
