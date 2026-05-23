import type { PlaceItem } from '../types';

interface MapPanelProps {
  places: PlaceItem[];
}

export default function MapPanel({ places }: MapPanelProps) {
  return (
    <section className="rounded-3xl border border-rose-100 bg-white/95 p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-rose-900">Map preview</h3>
          <p className="text-sm text-rose-500">Organize saved places visually and drop pins on the map.</p>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
          {places.length} pins
        </span>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-rose-50 text-rose-500">
        <div className="grid h-full place-items-center text-center px-6">
          <p className="max-w-xs text-sm leading-6">
            Map integration is ready for Mapbox or Google Maps. Here is a curated preview placeholder to keep the layout gentle and inviting.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-rose-600">
        {places.slice(0, 3).map((place) => (
          <div key={place.id} className="rounded-2xl bg-rose-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-rose-900">{place.title}</p>
                <p>{place.location}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.15em] text-rose-500 shadow-sm">
                {place.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
