import { Link } from 'react-router-dom';
import { sampleTripBoards } from '../mock/trips';
import MapPanel from '../components/MapPanel';
import PhoneFrame from '../components/PhoneFrame';
import RatingStars from '../components/RatingStars';
import Tag from '../components/Tag';

export default function Dashboard() {
  const activeBoard = sampleTripBoards[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-5xl">
        <div className="flex flex-col gap-4 rounded-[2.5rem] border border-rose-100 bg-white/95 p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rose-500">Atlas dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-rose-900">Your board snapshot</h1>
          </div>
          <Link
            to="/"
            className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Back to app
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[0.95fr_0.85fr]">
        <PhoneFrame>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-rose-500">Current board</p>
                <h2 className="mt-1 text-2xl font-semibold text-rose-900">{activeBoard.title}</h2>
              </div>
              <div className="rounded-3xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">Live</div>
            </div>

            <div className="rounded-[2rem] bg-rose-50 p-5 shadow-soft ring-1 ring-rose-100">
              <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Highlights</p>
              <p className="mt-3 text-lg font-semibold text-rose-900">8 places saved</p>
              <p className="mt-2 text-sm leading-6 text-rose-600">Your Atlas board organizes cafes, viewpoints, and spots with a soft, modern layout.</p>
            </div>

            <div className="grid gap-4">
              {activeBoard.places.map((place) => (
                <div key={place.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-rose-100">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-rose-900">{place.title}</p>
                      <p className="text-sm text-rose-600">{place.location}</p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
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

            <div className="grid grid-cols-3 gap-3 text-center text-rose-600">
              {['Map', 'Notes', 'Links'].map((item) => (
                <div key={item} className="rounded-3xl bg-rose-100 px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>

        <aside className="space-y-6">
          <div className="rounded-[2.5rem] border border-rose-100 bg-white/95 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-rose-900">Quick stats</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-rose-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Boards</p>
                <p className="mt-3 text-3xl font-semibold text-rose-900">12</p>
              </div>
              <div className="rounded-3xl bg-rose-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Saved spots</p>
                <p className="mt-3 text-3xl font-semibold text-rose-900">68</p>
              </div>
            </div>
          </div>

          <MapPanel places={activeBoard.places} />
        </aside>
      </div>
    </div>
  );
}
