'use client';

const CATEGORIES = ['All', 'Ethiopian', 'Burgers', 'Pizza', 'Sides', 'Drinks'];

export default function CategoryBar({ selected, onSelect }) {
  return (
    <div className="chips" role="group" aria-label="Filter by category">
      {CATEGORIES.map((cat) => {
        const isActive = selected.toLowerCase() === cat.toLowerCase();
        return (
          <button key={cat} type="button" className="chip" aria-pressed={isActive} onClick={() => onSelect(cat)}>
            {cat}
          </button>
        );
      })}
    </div>
  );
}
