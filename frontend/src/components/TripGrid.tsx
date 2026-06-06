import type { TripBoard } from '../types';

interface TripGridProps {
  boards: TripBoard[];
}

export default function TripGrid({ boards }: TripGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {boards.map((board) => (
        <article
          key={board.id}
          className="group cursor-pointer overflow-hidden rounded-[2.15rem] border-[1.5px] border-[var(--atlas-butter)] bg-white/70 p-2 transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(21,36,60,0.12)]"
        >
          <div className="relative aspect-[4/4.9] overflow-hidden rounded-[1.85rem] border border-[var(--atlas-butter-soft)]">
            <img
              src={board.cover}
              alt={board.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(21,36,60,0.54)] via-[rgba(21,36,60,0.12)] to-transparent" />
            <div className="absolute inset-x-4 bottom-4 rounded-[1.35rem] border border-white/30 bg-white/36 p-4 text-white backdrop-blur-md">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/72">Trip board</p>
                <p className="mt-1 text-[1.65rem] leading-none font-semibold" data-atlas-display="true">
                  {board.title}
                </p>
                <p className="mt-2 text-sm font-medium text-white/88">{board.places[0]?.location ?? board.description}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">{board.createdAt}</p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
