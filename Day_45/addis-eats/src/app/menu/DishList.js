import DishCard from './DishCard';

// `preloadFirst` is set only where this list is the first thing on the page
// (menu page 1), so its first photo is that page's single LCP image.
export default function DishList({ dishes, preloadFirst = false }) {
  if (!dishes || dishes.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No dishes match your search criteria.</p>;
  }

  return (
    <div className="dish-grid">
      {dishes.map((dish, i) => (
        <DishCard key={dish.id} dish={dish} priority={preloadFirst && i === 0} />
      ))}
    </div>
  );
}
