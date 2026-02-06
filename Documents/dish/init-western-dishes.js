// Seed random western dishes by category
// Run: mongosh restaurant < Documents/dish/init-western-dishes.js
// Depends on categories from: Documents/dish/init-western-categories.js

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cnLabel(categoryName) {
  return categoryName;
}

function buildDish({ name, priceMin, priceMax, description, categoryId, categoryName, tags }) {
  return {
    name,
    price: randInt(priceMin, priceMax),
    description,
    isDelisted: false,
    categoryId,
    tags: Array.from(new Set([cnLabel(categoryName), 'Western', ...(tags || [])]))
  };
}

const westernCategoryNames = [
  'Appetizers',
  'Salads',
  'Soups',
  'Pasta',
  'Pizza',
  'Main Courses',
  'Burgers & Sandwiches',
  'Sides',
  'Desserts',
  'Beverages'
];

const categories = db.categories.find({ name: { $in: westernCategoryNames } }).toArray();
const categoryIdByName = {};
categories.forEach((c) => {
  categoryIdByName[c.name] = c._id.valueOf();
});

const missing = westernCategoryNames.filter((n) => !categoryIdByName[n]);
if (missing.length) {
  print('❌ Missing categories. Please run init-western-categories.js first.');
  print('Missing: ' + missing.join(', '));
  quit(1);
}

const westernCategoryIds = westernCategoryNames.map((n) => categoryIdByName[n]);

// Only delete dishes belonging to these western categories (safer than wiping all dishes)
db.dishes.deleteMany({ categoryId: { $in: westernCategoryIds } });

const dishes = [];

// --- Appetizers (开胃菜) ---
(function () {
  const categoryName = 'Appetizers';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Bruschetta', priceMin: 28, priceMax: 42, description: 'A refreshing tomato-and-basil topping with olive oil, perfect to start.', tags: ['Not Spicy', 'Refreshing', 'Classic'] },
    { name: 'Garlic Bread', priceMin: 22, priceMax: 36, description: 'Crispy outside, soft inside, with rich garlic aroma.', tags: ['Not Spicy', 'Value'] },
    { name: 'Fried Calamari', priceMin: 38, priceMax: 58, description: 'Crispy and tender calamari, even better with a squeeze of lemon.', tags: ['Seafood', 'Great with Drinks', 'Popular'] },
    { name: 'Cheese Platter', priceMin: 68, priceMax: 118, description: 'A selection of cheeses served with nuts and fruit.', tags: ['Not Spicy', 'Premium', 'Atmosphere'] },
    { name: 'Baked Oysters', priceMin: 58, priceMax: 98, description: 'Cheese-baked oysters with a rich, savory finish.', tags: ['Seafood', 'Not Spicy', 'Hearty'] },
    { name: 'Chicken Wings', priceMin: 42, priceMax: 68, description: 'Juicy wings with a lightly charred, crispy skin.', tags: ['Chicken', 'Popular'] },
    { name: 'Smoked Salmon', priceMin: 68, priceMax: 118, description: 'Delicate smoked flavor with a smooth, silky texture.', tags: ['Seafood', 'Not Spicy', 'Premium'] },
    { name: 'Stuffed Mushrooms', priceMin: 36, priceMax: 58, description: 'Mushrooms stuffed with cheese and herbs for a fragrant bite.', tags: ['Vegetarian', 'Not Spicy'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Salads (沙拉) ---
(function () {
  const categoryName = 'Salads';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Caesar Salad', priceMin: 38, priceMax: 68, description: 'Romaine lettuce with Parmesan and classic Caesar dressing.', tags: ['Not Spicy', 'Classic', 'Refreshing'] },
    { name: 'Greek Salad', priceMin: 42, priceMax: 72, description: 'Cucumber and tomato with feta cheese and olives.', tags: ['Not Spicy', 'Refreshing'] },
    { name: 'Caprese Salad', priceMin: 48, priceMax: 78, description: 'Tomatoes with mozzarella, finished with fresh basil.', tags: ['Not Spicy', 'Cheese', 'Atmosphere'] },
    { name: 'Avocado Shrimp Salad', priceMin: 58, priceMax: 98, description: 'Creamy avocado paired with sweet, tender shrimp.', tags: ['Seafood', 'Healthy', 'Not Spicy'] },
    { name: 'Smoked Chicken Salad', priceMin: 52, priceMax: 88, description: 'Lean, high-protein smoked chicken with a light, fresh bite.', tags: ['Chicken', 'Healthy', 'Not Spicy'] },
    { name: 'Quinoa Salad', priceMin: 48, priceMax: 78, description: 'Quinoa with mixed vegetables and an olive-oil vinaigrette.', tags: ['Vegetarian', 'Healthy', 'Not Spicy'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Soups (汤品) ---
(function () {
  const categoryName = 'Soups';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Cream of Mushroom Soup', priceMin: 28, priceMax: 48, description: 'Rich and creamy with a smooth, comforting texture.', tags: ['Not Spicy', 'Creamy', 'Classic'] },
    { name: 'Pumpkin Soup', priceMin: 28, priceMax: 46, description: 'Naturally sweet, velvety, and wonderfully warming.', tags: ['Not Spicy', 'Kids', 'Refreshing'] },
    { name: 'French Onion Soup', priceMin: 38, priceMax: 58, description: 'Slow-cooked onions topped with golden, melted cheese.', tags: ['Not Spicy', 'Cheese', 'Classic'] },
    { name: 'Clam Chowder', priceMin: 42, priceMax: 68, description: 'Hearty clam chowder with a gentle creamy finish.', tags: ['Seafood', 'Not Spicy'] },
    { name: 'Minestrone', priceMin: 28, priceMax: 48, description: 'A veggie-packed Italian soup that is light and satisfying.', tags: ['Vegetarian', 'Not Spicy', 'Healthy'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Pasta (意面) ---
(function () {
  const categoryName = 'Pasta';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Spaghetti Bolognese', priceMin: 52, priceMax: 88, description: 'Classic spaghetti with a rich tomato beef ragù.', tags: ['Beef', 'Not Spicy', 'Classic', 'Filling'] },
    { name: 'Carbonara', priceMin: 58, priceMax: 92, description: 'Silky egg-and-cheese sauce with savory bacon.', tags: ['Pork', 'Creamy', 'Not Spicy'] },
    { name: 'Aglio e Olio', priceMin: 46, priceMax: 78, description: 'Garlic and olive oil pasta—simple, clean, and elegant.', tags: ['Vegetarian', 'Not Spicy', 'Refreshing'] },
    { name: 'Pesto Pasta', priceMin: 52, priceMax: 88, description: 'Fragrant basil pesto with a fresh herbal aroma.', tags: ['Not Spicy', 'Refreshing', 'Popular'] },
    { name: 'Seafood Linguine', priceMin: 78, priceMax: 128, description: 'Shrimp and shellfish in a garlicky white-wine sauce.', tags: ['Seafood', 'Not Spicy', 'Hearty'] },
    { name: 'Lasagna', priceMin: 68, priceMax: 118, description: 'Layered pasta with cheese and a hearty, rich filling.', tags: ['Cheese', 'Classic', 'Not Spicy'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Pizza (披萨) ---
(function () {
  const categoryName = 'Pizza';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Margherita', priceMin: 58, priceMax: 98, description: 'A classic combo of tomato, cheese, and fresh basil.', tags: ['Not Spicy', 'Classic', 'Cheese'] },
    { name: 'Pepperoni', priceMin: 68, priceMax: 118, description: 'Bold, savory pepperoni flavor with a satisfying bite.', tags: ['Pork', 'Popular'] },
    { name: 'Four Cheese', priceMin: 78, priceMax: 138, description: 'Cheese-forward and ultra-creamy with deep dairy aroma.', tags: ['Cheese', 'Not Spicy', 'Premium'] },
    { name: 'Seafood Pizza', priceMin: 88, priceMax: 158, description: 'Topped with shrimp and squid for a bright ocean taste.', tags: ['Seafood', 'Not Spicy', 'Hearty'] },
    { name: 'Veggie Pizza', priceMin: 62, priceMax: 108, description: 'Loaded with vegetables—fresh, light, and not greasy.', tags: ['Vegetarian', 'Not Spicy', 'Refreshing'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Main Courses (主菜) ---
(function () {
  const categoryName = 'Main Courses';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Ribeye Steak', priceMin: 168, priceMax: 298, description: 'Thick-cut and juicy, served with black pepper sauce.', tags: ['Beef', 'Not Spicy', 'Hearty', 'Business Dinner'] },
    { name: 'Grilled Salmon', priceMin: 128, priceMax: 198, description: 'Crispy skin with tender flakes and rich salmon fat.', tags: ['Seafood', 'Not Spicy', 'Healthy', 'Date Night'] },
    { name: 'Roast Chicken', priceMin: 98, priceMax: 158, description: 'Herb-roasted and deeply seasoned with crisp, golden skin.', tags: ['Chicken', 'Not Spicy', 'Classic'] },
    { name: 'Lamb Chops', priceMin: 168, priceMax: 268, description: 'Rich lamb flavor, great with refreshing mint sauce.', tags: ['Lamb', 'Not Spicy', 'Hearty'] },
    { name: 'BBQ Pork Ribs', priceMin: 128, priceMax: 198, description: 'Smoky-sweet BBQ glaze with tender, fall-off-the-bone ribs.', tags: ['Pork', 'Not Spicy', 'Popular', 'Great with Drinks'] },
    { name: 'Beef Bourguignon', priceMin: 138, priceMax: 228, description: 'Slow-braised beef in red wine until melt-in-your-mouth tender.', tags: ['Beef', 'Not Spicy', 'Premium'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Burgers & Sandwiches (汉堡/三明治) ---
(function () {
  const categoryName = 'Burgers & Sandwiches';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Cheeseburger', priceMin: 48, priceMax: 78, description: 'A juicy beef patty topped with melted cheese.', tags: ['Beef', 'Not Spicy', 'Popular'] },
    { name: 'Chicken Burger', priceMin: 46, priceMax: 72, description: 'Crispy outside, tender inside, with a hearty bite.', tags: ['Chicken', 'Not Spicy', 'Value'] },
    { name: 'Club Sandwich', priceMin: 48, priceMax: 78, description: 'Layered chicken, bacon, and vegetables in classic style.', tags: ['Chicken', 'Pork', 'Not Spicy', 'Classic'] },
    { name: 'Tuna Melt', priceMin: 52, priceMax: 88, description: 'Tuna salad with hot, melty cheese for extra richness.', tags: ['Seafood', 'Cheese', 'Not Spicy'] },
    { name: 'Reuben', priceMin: 58, priceMax: 98, description: 'A bold combination of beef, sauerkraut, and cheese.', tags: ['Beef', 'Not Spicy', 'Bold Flavor'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Sides (配菜) ---
(function () {
  const categoryName = 'Sides';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'French Fries', priceMin: 18, priceMax: 28, description: 'Crispy outside and fluffy inside—an all-time favorite.', tags: ['Not Spicy', 'Value', 'Kids'] },
    { name: 'Mashed Potatoes', priceMin: 22, priceMax: 36, description: 'Smooth and creamy with a rich buttery aroma.', tags: ['Not Spicy', 'Creamy'] },
    { name: 'Onion Rings', priceMin: 22, priceMax: 36, description: 'Crunchy onion rings with a fragrant, savory finish.', tags: ['Not Spicy', 'Great with Drinks'] },
    { name: 'Grilled Vegetables', priceMin: 26, priceMax: 42, description: 'Light and healthy—perfect alongside main dishes.', tags: ['Vegetarian', 'Not Spicy', 'Healthy'] },
    { name: 'Coleslaw', priceMin: 18, priceMax: 32, description: 'Sweet-and-tangy crunch that helps cut richness.', tags: ['Not Spicy', 'Refreshing', 'Value'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Desserts (甜品) ---
(function () {
  const categoryName = 'Desserts';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Tiramisu', priceMin: 38, priceMax: 58, description: 'Bold coffee and cocoa aroma with a delicate, creamy texture.', tags: ['Not Spicy', 'Premium', 'Atmosphere'] },
    { name: 'Cheesecake', priceMin: 38, priceMax: 62, description: 'Rich cheese flavor with a smooth, melt-in-your-mouth bite.', tags: ['Cheese', 'Not Spicy', 'Popular'] },
    { name: 'Crème Brûlée', priceMin: 36, priceMax: 58, description: 'Crackly caramel top with a silky vanilla custard underneath.', tags: ['Creamy', 'Not Spicy', 'Premium'] },
    { name: 'Panna Cotta', priceMin: 32, priceMax: 52, description: 'Light and delicate—perfect with fruit sauce for freshness.', tags: ['Not Spicy', 'Refreshing'] },
    { name: 'Brownie', priceMin: 28, priceMax: 48, description: 'Deep chocolate richness with a dense, fudgy texture.', tags: ['Not Spicy', 'Kids'] },
    { name: 'Ice Cream', priceMin: 22, priceMax: 42, description: 'Multiple flavors available; refreshing and great after meals.', tags: ['Not Spicy', 'Kids', 'Refreshing'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// --- Beverages (饮品) ---
(function () {
  const categoryName = 'Beverages';
  const categoryId = categoryIdByName[categoryName];
  const defs = [
    { name: 'Americano', priceMin: 18, priceMax: 32, description: 'Clean and smooth—perfect for a quick caffeine boost.', tags: ['Coffee', 'Not Spicy', 'Atmosphere'] },
    { name: 'Latte', priceMin: 22, priceMax: 38, description: 'Silky milk coffee with a gentle, creamy taste.', tags: ['Coffee', 'Creamy', 'Not Spicy'] },
    { name: 'Cappuccino', priceMin: 24, priceMax: 40, description: 'Foamy milk cap with pronounced coffee aroma.', tags: ['Coffee', 'Not Spicy'] },
    { name: 'Sparkling Water', priceMin: 12, priceMax: 22, description: 'Crisp bubbles that refresh and cut through richness.', tags: ['Not Spicy', 'Refreshing', 'Value'] },
    { name: 'Fresh Orange Juice', priceMin: 18, priceMax: 32, description: 'Vitamin C packed—sweet and tangy to awaken the palate.', tags: ['Not Spicy', 'Healthy', 'Kids'] },
    { name: 'Draft Beer', priceMin: 18, priceMax: 36, description: 'Ice-cold and easy to drink—great with food.', tags: ['Not Spicy', 'Great with Drinks', 'Party'] },
    { name: 'House Red Wine (Glass)', priceMin: 38, priceMax: 68, description: 'Light, fruity notes that pair well with main courses.', tags: ['Not Spicy', 'Atmosphere', 'Date Night'] },
    { name: 'House Red Wine (Bottle)', priceMin: 198, priceMax: 398, description: 'A shareable bottle, ideal for gatherings and celebrations.', tags: ['Not Spicy', 'Business Dinner', 'Premium'] }
  ];

  defs.forEach((d) => dishes.push(buildDish({ ...d, categoryId, categoryName })));
})();

// Insert
if (!dishes.length) {
  print('⚠️ No dishes generated.');
  quit(0);
}

db.dishes.insertMany(dishes);

print('✅ Inserted ' + dishes.length + ' western dishes.');
print('Western categoryIds: ' + westernCategoryIds.join(', '));
print('Total dishes in db.dishes: ' + db.dishes.countDocuments());
