import type { PlaceItem } from '../types';

interface MapPanelProps {
  places: PlaceItem[];
}

export default function MapPanel({ places }: MapPanelProps) {
  return (
    <section className="atlas-panel rounded-[2rem] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--atlas-ink)]">Map preview</h3>
          <p className="text-sm text-[var(--atlas-muted)]">Organize saved places visually and drop pins on the map.</p>
        </div>
        <span className="rounded-full bg-[rgba(47,108,114,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-sea)]">
          {places.length} pins
        </span>
      </div>
      <div className="atlas-grid relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-[rgba(21,36,60,0.07)] bg-[linear-gradient(180deg,rgba(220,232,228,0.55),rgba(255,251,244,0.85))] text-[var(--atlas-muted)]">
        <div className="absolute left-[16%] top-[30%] h-4 w-4 rounded-full bg-[var(--atlas-sun)] shadow-[0_0_0_10px_rgba(240,154,97,0.16)]" />
        <div className="absolute left-[54%] top-[46%] h-4 w-4 rounded-full bg-[var(--atlas-sea)] shadow-[0_0_0_10px_rgba(47,108,114,0.12)]" />
        <div className="absolute left-[70%] top-[26%] h-4 w-4 rounded-full bg-[var(--atlas-ink)] shadow-[0_0_0_10px_rgba(21,36,60,0.08)]" />
        <div className="grid h-full place-items-center px-6 text-center">
          <p className="max-w-xs text-sm leading-6">
            Map integration is ready for Mapbox or Google Maps. Here is a curated preview placeholder to keep the layout gentle and inviting.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-[var(--atlas-muted)]">
        {places.slice(0, 3).map((place) => (
          <div key={place.id} className="rounded-[1.25rem] bg-white/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--atlas-ink)]">{place.title}</p>
                <p>{place.location}</p>
              </div>
              <span className="rounded-full bg-[rgba(240,154,97,0.1)] px-3 py-1 text-xs uppercase tracking-[0.15em] text-[var(--atlas-sun)] shadow-sm">
                {place.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
