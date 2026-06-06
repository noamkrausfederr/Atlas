import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="atlas-panel mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full px-4 py-3 sm:px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2f6c72] text-sm font-bold text-white shadow-[0_10px_24px_rgba(47,108,114,0.28)]">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--atlas-ink)]">Atlas</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full bg-white/70 p-1 text-sm font-medium text-[var(--atlas-muted)] md:flex">
          <Link to="/" className="rounded-full px-4 py-2 text-[var(--atlas-ink)]">
            Explore
          </Link>
          <Link to="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-white hover:text-[var(--atlas-ink)]">
            Trips
          </Link>
          <span className="cursor-default rounded-full px-4 py-2 text-slate-400">Inspiration</span>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-[var(--atlas-muted)] transition hover:bg-white/80 hover:text-[var(--atlas-ink)] sm:inline-flex"
          >
            Host a board
          </button>
          <Link
            to="/dashboard"
            className="rounded-full bg-[var(--atlas-ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#213452] sm:px-5"
          >
            Open Atlas
          </Link>
        </div>
      </div>
    </header>
  );
}
