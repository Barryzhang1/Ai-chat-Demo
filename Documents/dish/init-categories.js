// 初始化菜品分类数据
// 运行方法: mongosh restaurant < Documents/scripts/init-categories.js

db.categories.insertMany([
  {
    name: "凉菜",
    sortOrder: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "热菜",
    sortOrder: 90,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "汤品",
    sortOrder: 80,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "主食",
    sortOrder: 70,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "饮品",
    sortOrder: 60,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "小吃",
    sortOrder: 50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "甜品",
    sortOrder: 40,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "烧烤",
    sortOrder: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "火锅",
    sortOrder: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "特色菜",
    sortOrder: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("✅ Successfully initialized 10 categories!");
print("Categories created:", db.categories.countDocuments());
