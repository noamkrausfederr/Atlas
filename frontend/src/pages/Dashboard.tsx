import { Link } from 'react-router-dom';
import { sampleTripBoards } from '../mock/trips';
import MapPanel from '../components/MapPanel';
import PhoneFrame from '../components/PhoneFrame';
import RatingStars from '../components/RatingStars';
import Tag from '../components/Tag';

export default function Dashboard() {
  const activeBoard = sampleTripBoards[0];

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-6xl">
        <div className="atlas-panel flex flex-col gap-4 rounded-[2.5rem] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="atlas-kicker">Atlas dashboard</p>
            <h1 className="mt-3 text-5xl leading-none text-[var(--atlas-ink)]">Your board snapshot</h1>
          </div>
          <Link
            to="/"
            className="rounded-full bg-[var(--atlas-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#213452]"
          >
            Back to app
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[0.95fr_0.85fr]">
        <PhoneFrame>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--atlas-sea)]">Current board</p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--atlas-ink)]">{activeBoard.title}</h2>
              </div>
              <div className="rounded-3xl bg-[rgba(240,154,97,0.14)] px-3 py-2 text-sm font-semibold text-[var(--atlas-sun)]">Live</div>
            </div>

            <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(47,108,114,0.12),rgba(255,251,244,0.96))] p-5 shadow-soft ring-1 ring-[rgba(21,36,60,0.06)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--atlas-sea)]">Highlights</p>
              <p className="mt-3 text-lg font-semibold text-[var(--atlas-ink)]">8 places saved</p>
              <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">Your Atlas board organizes cafes, viewpoints, and spots in one editorial, map-aware layout.</p>
            </div>

            <div className="grid gap-4">
              {activeBoard.places.map((place) => (
                <div key={place.id} className="rounded-3xl bg-white/82 p-4 shadow-sm ring-1 ring-[rgba(21,36,60,0.07)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--atlas-ink)]">{place.title}</p>
                      <p className="text-sm text-[var(--atlas-muted)]">{place.location}</p>
                    </div>
                    <span className="rounded-full bg-[rgba(47,108,114,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-sea)]">
                      {place.category}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {place.tags.map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-[var(--atlas-muted)]">
              {['Map', 'Notes', 'Links'].map((item) => (
                <div key={item} className="rounded-3xl bg-white/78 px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--atlas-sea)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>

        <aside className="space-y-6">
          <div className="atlas-panel rounded-[2.5rem] p-6">
            <h2 className="text-lg font-semibold text-[var(--atlas-ink)]">Quick stats</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--atlas-sea)]">Boards</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--atlas-ink)]">12</p>
              </div>
              <div className="rounded-3xl bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--atlas-sea)]">Saved spots</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--atlas-ink)]">68</p>
              </div>
            </div>
          </div>

          <MapPanel places={activeBoard.places} />
        </aside>
      </div>
    </div>
  );
}
