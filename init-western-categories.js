// Initialize western restaurant menu categories
// Run: mongosh restaurant < Documents/dish/init-western-categories.js

// Name format: English

db.categories.insertMany([
  {
    name: "Appetizers",
    sortOrder: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Salads",
    sortOrder: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Soups",
    sortOrder: 80,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Pasta",
    sortOrder: 70,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Pizza",
    sortOrder: 60,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Main Courses",
    sortOrder: 50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Burgers & Sandwiches",
    sortOrder: 40,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Sides",
    sortOrder: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Desserts",
    sortOrder: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Beverages",
    sortOrder: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("✅ Successfully initialized 10 western categories!");
print("Categories created:", db.categories.countDocuments());
