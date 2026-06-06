import type { TripBoard } from '../types';

interface DiscoverMasonryProps {
  boards: TripBoard[];
}

type Pin = {
  id: string;
  title: string;
  location: string;
  cover: string;
  boardTitle: string;
  aspect: 'tall' | 'square' | 'wide';
};

const aspectClasses: Record<Pin['aspect'], string> = {
  tall: 'aspect-[3/4]',
  square: 'aspect-square',
  wide: 'aspect-[4/3]'
};

function buildPins(boards: TripBoard[]): Pin[] {
  const aspects: Pin['aspect'][] = ['tall', 'square', 'wide', 'tall', 'square'];
  const pins: Pin[] = [];
  let i = 0;

  for (const board of boards) {
    for (const place of board.places) {
      pins.push({
        id: place.id,
        title: place.title,
        location: place.location,
        cover: place.cover,
        boardTitle: board.title,
        aspect: aspects[i % aspects.length]
      });
      i += 1;
    }
    pins.push({
      id: `${board.id}-cover`,
      title: board.title,
      location: board.description,
      cover: board.cover,
      boardTitle: board.title,
      aspect: aspects[i % aspects.length]
    });
    i += 1;
  }

  return pins;
}

export default function DiscoverMasonry({ boards }: DiscoverMasonryProps) {
  const pins = buildPins(boards);

  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
      {pins.map((pin) => (
        <article key={pin.id} className="mb-4 break-inside-avoid">
          <div className="atlas-panel group relative overflow-hidden rounded-[1.75rem] p-2">
            <div className={`relative overflow-hidden ${aspectClasses[pin.aspect]}`}>
              <img
                src={pin.cover}
                alt={pin.title}
                className="h-full w-full rounded-[1.2rem] object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-[1.2rem] bg-gradient-to-t from-[rgba(21,36,60,0.42)] via-transparent to-transparent" />
              <button
                type="button"
                aria-label="Save pin"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-md backdrop-blur transition group-hover:opacity-100"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
            <div className="px-2 pb-2 pt-3">
              <p className="line-clamp-1 text-sm font-semibold text-[var(--atlas-ink)]">{pin.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--atlas-muted)]">{pin.location}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--atlas-sea)]">{pin.boardTitle}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
