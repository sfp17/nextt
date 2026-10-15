export const PAGE_SIZE = 6; // 2 full rows of 3 (or 3 rows of 2) in the grid

// Every dish photo is 1200×900 (4:3); DishCard and the detail page use these as the real dimensions.
export const DISH_IMAGE_WIDTH = 1200;
export const DISH_IMAGE_HEIGHT = 900;

export const dishes = [
  { id: '1', name: 'Doro Wat', price: 350, category: 'ethiopian', desc: 'Spiced chicken stew cooked in berbere and spiced butter, served with hard-boiled eggs.', updatedAt: '2026-10-07', image: '/images/dishes/1.jpg', imageAlt: 'Doro Wat: chicken drumsticks and hard-boiled eggs in a deep red berbere sauce, in a black clay pot' },
  { id: '2', name: 'Beyaynetu', price: 220, category: 'ethiopian', desc: 'A colourful injera platter of lentils, split peas, collard greens, beetroot, cabbage and fresh salad, served around a spiced beef wat.', updatedAt: '2026-10-07', image: '/images/dishes/2.jpg', imageAlt: 'Beyaynetu: injera topped with yellow split peas, lentils, collard greens, beetroot, cabbage, salad and a beef stew in the centre' },
  { id: '7', name: 'Beef Tibs', price: 320, category: 'ethiopian', desc: 'Sizzling beef cubes sautéed with onions, green and red peppers and fresh rosemary.', updatedAt: '2026-10-07', image: '/images/dishes/7.jpg', imageAlt: 'Beef Tibs: browned beef cubes with onions and green and red peppers on a sizzling black plate, topped with rosemary' },
  { id: '6', name: 'Shiro Tegabino', price: 180, category: 'ethiopian', desc: 'Bubbling chickpea stew served in a clay pot with garlic and green chili.', updatedAt: '2026-10-07', image: '/images/dishes/6.jpg', imageAlt: 'Shiro Tegabino: smooth orange chickpea stew in a black clay pot, with injera beside it' },
  { id: '4', name: 'Addis Gourmet Burger', price: 280, category: 'burgers', desc: 'Two handcrafted beef patties with melted cheddar, pickles, diced onion, lettuce and house sauce.', updatedAt: '2026-10-07', image: '/images/dishes/4.jpg', imageAlt: 'Addis Gourmet Burger: double beef patty with melted cheddar, pickles, onion and lettuce in a sesame bun, fries behind' },
  { id: '8', name: 'Spicy Awaze Burger', price: 300, category: 'burgers', desc: 'Grilled beef patty with cheddar, crispy bacon, red onion and pickles, glazed with a smoky awaze-chili sauce.', updatedAt: '2026-10-07', image: '/images/dishes/8.jpg', imageAlt: 'Spicy Awaze Burger: beef patty with cheddar, crispy bacon, red onion and pickles, dripping with a dark glaze' },
  { id: '9', name: 'Chicken Burger', price: 260, category: 'burgers', desc: 'Crispy chicken fillet, lettuce, tomato, and garlic mayo on a toasted bun.', updatedAt: '2026-10-07', image: '/images/dishes/9.jpg', imageAlt: 'Chicken Burger: crispy fried chicken fillet with lettuce, tomato and creamy sauce in a sesame bun' },
  { id: '17', name: 'Pepperoni Pizza', price: 450, category: 'pizza', desc: 'Classic pizza with tomato sauce, melted mozzarella and crispy pepperoni.', updatedAt: '2026-10-07', image: '/images/dishes/17.jpg', imageAlt: 'Pepperoni Pizza: a whole sliced pizza covered in pepperoni and melted cheese on a wooden board' },
  { id: '18', name: 'Tuna Pizza', price: 420, category: 'pizza', desc: 'Tomato sauce and mozzarella topped with flaked tuna, red onion and fresh parsley.', updatedAt: '2026-10-07', image: '/images/dishes/18.jpg', imageAlt: 'Tuna Pizza: pizza topped with flaked tuna, red onion and parsley, a cheesy slice being lifted' },
  { id: '19', name: 'Beef Pizza', price: 480, category: 'pizza', desc: 'Seasoned beef strips with red and green peppers, red onion and mozzarella.', updatedAt: '2026-10-07', image: '/images/dishes/19.jpg', imageAlt: 'Beef Pizza: pizza with strips of seasoned beef, red and green peppers and red onion' },
  { id: '20', name: 'Chicken Pizza', price: 450, category: 'pizza', desc: 'Spiced grilled chicken strips on tomato sauce and mozzarella, finished with fresh herbs.', updatedAt: '2026-10-07', image: '/images/dishes/20.jpg', imageAlt: 'Chicken Pizza: pizza covered in spiced grilled chicken strips and herbs on a wooden board' },
  { id: '23', name: 'French Fries', price: 120, category: 'sides', desc: 'Golden, crispy fries lightly seasoned with salt and herbs, served with ketchup.', updatedAt: '2026-10-07', image: '/images/dishes/23.jpg', imageAlt: 'French Fries: a basket of golden fries with herbs and a small bowl of ketchup' },
  { id: '5', name: 'Fresh Avocado Juice', price: 90, category: 'drinks', desc: 'Thick, creamy blended fresh avocado, served chilled.', updatedAt: '2026-10-07', image: '/images/dishes/5.jpg', imageAlt: 'Fresh Avocado Juice: a tall glass of thick green avocado smoothie with avocado slices on top' },
  { id: '13', name: 'Chocolate Milkshake', price: 150, category: 'drinks', desc: 'Rich chocolate milkshake topped with whipped cream, chocolate sauce and shavings.', updatedAt: '2026-10-07', image: '/images/dishes/13.jpg', imageAlt: 'Chocolate Milkshake: a tall glass with chocolate drizzle, topped with whipped cream and chocolate shavings' },
  { id: '14', name: 'Iced Latte', price: 120, category: 'drinks', desc: 'Ethiopian espresso poured over ice and cold milk.', updatedAt: '2026-10-07', image: '/images/dishes/14.jpg', imageAlt: 'Iced Latte: a tall glass of iced coffee with milk and ice cubes, coffee beans on the table' },
  { id: '15', name: 'Strawberry Smoothie', price: 130, category: 'drinks', desc: 'Fresh strawberries blended smooth and served ice-cold.', updatedAt: '2026-10-07', image: '/images/dishes/15.jpg', imageAlt: 'Strawberry Smoothie: a glass of pink strawberry smoothie with a strawberry on the rim' },
  { id: '16', name: 'Mango Smoothie', price: 130, category: 'drinks', desc: 'Ripe mango blended thick and smooth, topped with fresh mango cubes and mint.', updatedAt: '2026-10-07', image: '/images/dishes/16.jpg', imageAlt: 'Mango Smoothie: a tall glass of bright orange mango smoothie topped with mango cubes and mint' },
  { id: '21', name: 'Sprite', price: 50, category: 'drinks', desc: 'Chilled lemon-lime soda, 330 ml can.', updatedAt: '2026-10-07', image: '/images/dishes/21.jpg', imageAlt: 'A green can of Sprite lemon-lime soda with lime halves and ice' },
  { id: '22', name: 'Fanta Orange', price: 50, category: 'drinks', desc: 'Chilled orange soda, 330 ml can.', updatedAt: '2026-10-07', image: '/images/dishes/22.jpg', imageAlt: 'An orange can of Fanta Orange soda with orange halves and ice' },
];

export function getDish(id) {
  return dishes.find((d) => d.id === id) ?? null;
}

/**
 * Single source of truth for "search + filter + page".
 * Used by the API route AND by the server component that seeds page 1,
 * so the server-rendered first page is byte-for-byte what the API returns.
 */
export function queryDishes({ q = '', category = 'all', page = 1, limit = PAGE_SIZE } = {}) {
  const term = q.trim().toLowerCase();
  const cat = category.toLowerCase();

  const matches = dishes.filter((d) => {
    const matchesTerm = !term || d.name.toLowerCase().includes(term);
    const matchesCategory = cat === 'all' || d.category === cat;
    return matchesTerm && matchesCategory;
  });

  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: matches.slice(start, start + limit),
    page: safePage,
    limit,
    total,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

// Builds the SWR key for the paged list. Keys must be built the same way
// everywhere, otherwise the server-seeded fallback never matches.
export function dishesPageKey({ page = 1, category = 'all' } = {}) {
  return `/api/dishes?page=${page}&limit=${PAGE_SIZE}&category=${encodeURIComponent(category.toLowerCase())}`;
}
