// Nested layout for /menu and /menu/[id] (kept from Day 40).
// The old "Quick Nav" sidebar repeated the header links, so it's gone and the
// menu uses the full page width. The card `sizes` in DishCard.jsx match this.
export default function MenuLayout({ children }) {
  return <div className="menu-section">{children}</div>;
}
