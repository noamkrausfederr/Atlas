export default function HeroSearch() {
  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <div className="atlas-panel flex flex-col overflow-hidden rounded-[2rem] sm:flex-row sm:items-stretch sm:divide-x sm:divide-[rgba(21,36,60,0.08)]">
        <label className="flex flex-1 flex-col px-5 py-4 text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">Where</span>
          <input
            type="text"
            placeholder="Search destinations"
            className="mt-1 border-0 bg-transparent p-0 text-sm text-[var(--atlas-ink)] placeholder:text-slate-400 focus:ring-0"
          />
        </label>
        <label className="flex flex-1 flex-col px-5 py-4 text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">Vibe</span>
          <input
            type="text"
            placeholder="Food, beaches, hikes"
            className="mt-1 border-0 bg-transparent p-0 text-sm text-[var(--atlas-ink)] placeholder:text-slate-400 focus:ring-0"
          />
        </label>
        <label className="flex flex-1 flex-col px-5 py-4 text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">When</span>
          <input
            type="text"
            placeholder="Add dates"
            className="mt-1 border-0 bg-transparent p-0 text-sm text-[var(--atlas-ink)] placeholder:text-slate-400 focus:ring-0"
          />
        </label>
        <div className="flex items-center p-2 sm:pl-0">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--atlas-sun)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 sm:w-auto sm:py-3.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
