import { Link } from 'react-router-dom';
import CategoryScroll from '../components/CategoryScroll';
import DiscoverMasonry from '../components/DiscoverMasonry';
import HeroSearch from '../components/HeroSearch';
import Navbar from '../components/Navbar';
import PhoneFrame from '../components/PhoneFrame';
import TripGrid from '../components/TripGrid';
import { sampleTripBoards } from '../mock/trips';

export default function Homepage() {
  const featuredBoard = sampleTripBoards[0];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main>
        {/* Hero — Airbnb-style */}
        <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-medium text-[#FF385C]">Plan trips you will actually take</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Save places. Build boards. Travel with clarity.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Atlas combines Airbnb-style trip planning with Pinterest-style visual discovery — curated boards, saved spots, and maps in one beautiful flow.
            </p>
            <HeroSearch />
          </div>
          <CategoryScroll />
        </section>

        {/* Pinterest-style discovery */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Ideas for your next trip</h2>
                <p className="mt-2 max-w-xl text-slate-600">Scroll a visual feed of saved places and boards — pin what inspires you.</p>
              </div>
              <Link to="/dashboard" className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
                View all boards →
              </Link>
            </div>
            <DiscoverMasonry boards={sampleTripBoards} />
          </div>
        </section>

        {/* Featured boards — Airbnb cards */}
        <section className="border-t border-slate-100 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Popular trip boards</h2>
              <p className="mt-2 text-slate-600">Image-first cards with spots, tags, and quick context.</p>
            </div>
            <TripGrid boards={sampleTripBoards} />
          </div>
        </section>

        {/* App preview */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Mobile-first</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Your planner, in your pocket</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                See how Atlas feels on the go — upcoming trips, journey highlights, and map previews in a focused phone layout.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  Horizontal trip boards with saved place counts
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  Journey cards with stops remaining
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  Map preview for pinned destinations
                </li>
              </ul>
              <Link
                to="/dashboard"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Atlas dashboard
              </Link>
            </div>

            <PhoneFrame>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Hello, Nia</p>
                    <h3 className="mt-0.5 text-lg font-semibold text-slate-900">Your trips</h3>
                  </div>
                  <span className="rounded-full bg-[#FF385C]/10 px-2.5 py-1 text-[0.65rem] font-semibold text-[#FF385C]">New</span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {sampleTripBoards.map((board) => (
                    <div
                      key={board.id}
                      className="min-w-[9.5rem] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={board.cover} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-slate-900">{board.title}</p>
                        <p className="mt-0.5 text-[0.65rem] text-slate-500">{board.places.length} spots</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={featuredBoard.places[0]?.cover ?? featuredBoard.cover}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400">Journey</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{featuredBoard.places[0]?.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{featuredBoard.places[0]?.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Saved', value: '24' },
                    { label: 'Favorites', value: '8' },
                    { label: 'Inspo', value: '5' }
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-slate-50 py-2.5">
                      <p className="text-[0.6rem] uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <p className="mt-0.5 text-base font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PhoneFrame>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-100 bg-slate-900 px-4 py-14 text-center text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold sm:text-3xl">Start your next board today</h2>
            <p className="mt-3 text-slate-300">Join thousands of travelers curating trips with Atlas.</p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
