import { useState } from 'react';

const categories = [
  { label: 'Beaches', icon: '🏖️' },
  { label: 'Food', icon: '🍜' },
  { label: 'City', icon: '🏙️' },
  { label: 'Hiking', icon: '🥾' },
  { label: 'Cafes', icon: '☕' },
  { label: 'Views', icon: '🌅' },
  { label: 'Nightlife', icon: '🌙' },
  { label: 'Museums', icon: '🖼️' }
];

export default function CategoryScroll() {
  const [active, setActive] = useState(categories[0].label);

  return (
    <div className="mt-10 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex w-max max-w-7xl gap-3 px-4 sm:px-6 lg:px-8">
        {categories.map((category) => {
          const isActive = active === category.label;
          return (
            <button
              key={category.label}
              type="button"
              onClick={() => setActive(category.label)}
              className={`flex shrink-0 items-center gap-3 rounded-full border px-4 py-3 transition ${
                isActive
                  ? 'border-[rgba(47,108,114,0.2)] bg-white text-[var(--atlas-ink)] shadow-[0_12px_32px_rgba(21,36,60,0.08)]'
                  : 'border-transparent bg-white/55 text-[var(--atlas-muted)] hover:bg-white/80'
              }`}
            >
              <span className="text-[1.35rem] leading-none">{category.icon}</span>
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em]">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
