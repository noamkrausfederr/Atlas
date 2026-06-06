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
  const featuredPlace = featuredBoard.places[0];

  return (
    <div className="min-h-screen text-slate-900">
      <Navbar />

      <main className="pb-16">
        <section className="px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="atlas-kicker">Travel planning, without the tab chaos</p>
              <h1 className="mt-5 text-5xl leading-none text-[var(--atlas-ink)] sm:text-6xl lg:text-[5.25rem]">
                Build the trip before you book the flight.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[var(--atlas-muted)] sm:text-lg">
                Atlas turns scattered screenshots, maps, and saved videos into calm, visual trip boards that actually help you decide where to go next.
              </p>
              <HeroSearch />
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--atlas-muted)]">
                <span className="rounded-full bg-white/75 px-4 py-2">Curated place boards</span>
                <span className="rounded-full bg-white/75 px-4 py-2">Map-aware planning</span>
                <span className="rounded-full bg-white/75 px-4 py-2">Mobile-ready trip flow</span>
              </div>
            </div>

            <div className="relative">
              <div className="atlas-panel atlas-wash relative overflow-hidden rounded-[2.5rem] p-5 sm:p-6">
                <div className="absolute right-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-sea)]">
                  Early Summer Edit
                </div>
                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative overflow-hidden rounded-[2rem]">
                    <img src={featuredBoard.cover} alt={featuredBoard.title} className="aspect-[4/5] w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(21,36,60,0.55)] via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/75">Featured board</p>
                      <h2 className="mt-2 text-4xl leading-none" data-atlas-display="true">
                        {featuredBoard.title}
                      </h2>
                      <p className="mt-3 max-w-xs text-sm leading-6 text-white/84">{featuredBoard.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[1.75rem] bg-[var(--atlas-ink)] p-5 text-white">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/65">Why people save</p>
                      <p className="mt-4 text-3xl leading-none" data-atlas-display="true">
                        Boards that feel like moodboards, not spreadsheets.
                      </p>
                    </div>

                    <div className="rounded-[1.75rem] bg-white/90 p-4">
                      <img src={featuredPlace?.cover} alt={featuredPlace?.title} className="aspect-[4/3] w-full rounded-[1.2rem] object-cover" />
                      <div className="mt-4">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--atlas-sea)]">Pinned now</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--atlas-ink)]">{featuredPlace?.title}</p>
                        <p className="text-sm text-[var(--atlas-muted)]">{featuredPlace?.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CategoryScroll />
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="atlas-kicker">Discovery feed</p>
                <h2 className="mt-3 text-4xl leading-none text-[var(--atlas-ink)] sm:text-5xl">Collect the feeling first.</h2>
                <p className="mt-3 max-w-xl text-[var(--atlas-muted)]">Scroll an inspiration feed built for real trip planning, not endless bookmarking.</p>
              </div>
              <Link to="/dashboard" className="text-sm font-semibold text-[var(--atlas-ink)] underline-offset-4 hover:underline">
                View all boards →
              </Link>
            </div>
            <DiscoverMasonry boards={sampleTripBoards} />
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="atlas-panel rounded-[2.5rem] p-7">
              <p className="atlas-kicker">Planning system</p>
              <h2 className="mt-4 text-4xl leading-none text-[var(--atlas-ink)] sm:text-5xl">A trip board should guide decisions, not just store links.</h2>
              <p className="mt-5 text-base leading-7 text-[var(--atlas-muted)]">
                Atlas groups the visuals, context, and map signals together so inspiration can mature into an itinerary.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ['01', 'Capture', 'Save places from videos, maps, and posts into one calm view.'],
                  ['02', 'Compare', 'See categories, neighborhoods, and ratings side by side.'],
                  ['03', 'Commit', 'Turn saved ideas into a board you can actually travel with.']
                ].map(([index, title, copy]) => (
                  <div key={title} className="rounded-[1.6rem] bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--atlas-sea)]">{index}</p>
                    <p className="mt-3 font-semibold text-[var(--atlas-ink)]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-8">
                <p className="atlas-kicker">Curated boards</p>
                <h2 className="mt-3 text-4xl leading-none text-[var(--atlas-ink)] sm:text-5xl">Popular routes and saves</h2>
                <p className="mt-3 text-[var(--atlas-muted)]">Image-first cards with enough context to make choices quickly.</p>
              </div>
              <TripGrid boards={sampleTripBoards} />
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="atlas-kicker">Mobile-first</p>
              <h2 className="mt-3 text-4xl leading-none text-[var(--atlas-ink)] sm:text-5xl">Your planner, in your pocket</h2>
              <p className="mt-4 text-base leading-7 text-[var(--atlas-muted)]">
                See how Atlas feels on the go — upcoming trips, journey highlights, and map previews in a focused phone layout.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--atlas-ink)]">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(47,108,114,0.12)] text-[var(--atlas-sea)]">✓</span>
                  Horizontal trip boards with saved place counts
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(47,108,114,0.12)] text-[var(--atlas-sea)]">✓</span>
                  Journey cards with stops remaining
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(47,108,114,0.12)] text-[var(--atlas-sea)]">✓</span>
                  Map preview for pinned destinations
                </li>
              </ul>
              <Link
                to="/dashboard"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--atlas-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#213452]"
              >
                Open Atlas dashboard
              </Link>
            </div>

            <PhoneFrame>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--atlas-muted)]">Hello, Nia</p>
                    <h3 className="mt-0.5 text-lg font-semibold text-[var(--atlas-ink)]">Your trips</h3>
                  </div>
                  <span className="rounded-full bg-[rgba(240,154,97,0.14)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--atlas-sun)]">New</span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {sampleTripBoards.map((board) => (
                    <div
                      key={board.id}
                      className="min-w-[8.6rem] shrink-0 overflow-hidden rounded-[1.75rem] border-[1.5px] border-[var(--atlas-butter)] bg-white/85 p-1.5 shadow-sm"
                    >
                      <div className="relative aspect-[4/4.9] overflow-hidden rounded-[1.45rem] border border-[var(--atlas-butter-soft)]">
                        <img src={board.cover} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(21,36,60,0.56)] via-transparent to-transparent" />
                        <div className="absolute inset-x-2.5 bottom-2.5 rounded-[1rem] border border-white/25 bg-white/36 p-2.5 text-white backdrop-blur-md">
                          <p className="text-[0.7rem] font-semibold leading-tight">{board.title}</p>
                          <p className="mt-1 text-[0.6rem] text-white/82">{board.places[0]?.location}</p>
                          <p className="mt-1 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-white/70">{board.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[rgba(21,36,60,0.07)] bg-white/88">
                  <img
                    src={featuredBoard.places[0]?.cover ?? featuredBoard.cover}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-[var(--atlas-sea)]">Journey</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--atlas-ink)]">{featuredBoard.places[0]?.title}</p>
                    <p className="mt-1 text-xs text-[var(--atlas-muted)]">{featuredBoard.places[0]?.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Saved', value: '24' },
                    { label: 'Favorites', value: '8' },
                    { label: 'Inspo', value: '5' }
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white/72 py-2.5">
                      <p className="text-[0.6rem] uppercase tracking-wider text-[var(--atlas-muted)]">{stat.label}</p>
                      <p className="mt-0.5 text-base font-semibold text-[var(--atlas-ink)]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PhoneFrame>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[2.7rem] bg-[var(--atlas-ink)] px-6 py-14 text-center text-white sm:px-10">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/60">Ready to plan better</p>
            <h2 className="mt-4 text-4xl leading-none sm:text-5xl" data-atlas-display="true">
              Start your next board today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/72">Join travelers curating trips with stronger context, clearer saves, and one shared map view.</p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--atlas-sun)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
