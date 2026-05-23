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
      <div className="mx-auto flex w-max max-w-7xl gap-2 px-4 sm:px-6 lg:px-8">
        {categories.map((category) => {
          const isActive = active === category.label;
          return (
            <button
              key={category.label}
              type="button"
              onClick={() => setActive(category.label)}
              className={`flex shrink-0 flex-col items-center gap-2 border-b-2 px-3 pb-3 pt-1 transition ${
                isActive ? 'border-slate-900 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <span className="text-[1.65rem] leading-none">{category.icon}</span>
              <span className="whitespace-nowrap text-xs font-medium text-slate-700">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
