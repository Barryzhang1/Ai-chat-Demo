#!/bin/bash

# 简化版类别初始化脚本（用于Docker环境）
# 用途：在Docker容器中初始化菜品类别

# 使用docker-compose中的MongoDB服务
CONTAINER_NAME="chat-mongodb"

echo "================================"
echo "菜品类别初始化脚本 (Docker版)"
echo "================================"
echo ""

# 检查容器是否运行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "错误: MongoDB容器 '$CONTAINER_NAME' 未运行"
    echo "提示: 请先启动MongoDB服务"
    echo "      docker-compose -f docker-compose.db.yml up -d"
    exit 1
fi

echo "✓ MongoDB容器运行中"
echo ""

# 在Docker容器中执行MongoDB命令
docker exec -i "$CONTAINER_NAME" mongosh -u root -p password --authenticationDatabase admin restaurant <<'EOF'

// 定义10个菜品类别
const categories = [
  { name: "凉菜", sortOrder: 10, isActive: true },
  { name: "热菜", sortOrder: 9, isActive: true },
  { name: "汤羹", sortOrder: 8, isActive: true },
  { name: "主食", sortOrder: 7, isActive: true },
  { name: "小吃", sortOrder: 6, isActive: true },
  { name: "甜品", sortOrder: 5, isActive: true },
  { name: "饮品", sortOrder: 4, isActive: true },
  { name: "海鲜", sortOrder: 3, isActive: true },
  { name: "素食", sortOrder: 2, isActive: true },
  { name: "特色菜", sortOrder: 1, isActive: true }
];

let insertedCount = 0;
let updatedCount = 0;

print("开始初始化类别...");
print("");

categories.forEach(category => {
  const result = db.categories.updateOne(
    { name: category.name },
    { 
      $set: {
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  
  if (result.upsertedCount > 0) {
    insertedCount++;
    print("✓ 新增类别: " + category.name);
  } else if (result.modifiedCount > 0) {
    updatedCount++;
    print("✓ 更新类别: " + category.name);
  } else {
    print("- 类别已存在: " + category.name);
  }
});

print("");
print("================================");
print("初始化完成");
print("新增: " + insertedCount + " 个");
print("更新: " + updatedCount + " 个");
print("总计: " + db.categories.countDocuments() + " 个类别");
print("================================");

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✓ 类别初始化成功！"
    echo "================================"
else
    echo ""
    echo "================================"
    echo "✗ 类别初始化失败！"
    echo "================================"
    exit 1
fi
