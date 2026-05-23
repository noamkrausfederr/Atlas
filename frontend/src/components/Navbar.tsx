import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF385C] text-sm font-bold text-white">A</span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Atlas</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link to="/" className="text-slate-900">
            Explore
          </Link>
          <Link to="/dashboard" className="transition hover:text-slate-900">
            Trips
          </Link>
          <span className="cursor-default text-slate-400">Inspiration</span>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
          >
            Host a board
          </button>
          <Link
            to="/dashboard"
            className="rounded-full bg-[#FF385C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e31c5f] sm:px-5"
          >
            Open Atlas
          </Link>
        </div>
      </div>
    </header>
  );
}
