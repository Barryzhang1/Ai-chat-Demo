#!/bin/bash

# 初始化菜品类别脚本
# 用途：向MongoDB数据库中插入10个预定义的菜品类别

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置
MONGO_HOST=${MONGO_HOST:-localhost}
MONGO_PORT=${MONGO_PORT:-27017}
MONGO_USER=${MONGO_USER:-root}
MONGO_PASSWORD=${MONGO_PASSWORD:-password}
MONGO_DATABASE=${MONGO_DATABASE:-restaurant}
MONGO_AUTH_SOURCE=${MONGO_AUTH_SOURCE:-admin}

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}菜品类别初始化脚本${NC}"
echo -e "${GREEN}================================${NC}"

# 构建MongoDB连接字符串
if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASSWORD" ]; then
    MONGO_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}?authSource=${MONGO_AUTH_SOURCE}"
else
    MONGO_URI="mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}"
fi

echo -e "${YELLOW}连接信息:${NC}"
echo -e "  数据库: ${MONGO_DATABASE}"
echo -e "  主机: ${MONGO_HOST}:${MONGO_PORT}"
echo ""

# 检查MongoDB连接
echo -e "${YELLOW}检查MongoDB连接...${NC}"
if ! mongosh --eval "db.version()" "$MONGO_URI" > /dev/null 2>&1; then
    echo -e "${RED}错误: 无法连接到MongoDB${NC}"
    echo -e "${YELLOW}提示: 请确保MongoDB服务已启动${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MongoDB连接成功${NC}"
echo ""

# 定义类别数据
echo -e "${YELLOW}准备插入10个菜品类别...${NC}"
echo ""

# 执行插入操作
mongosh "$MONGO_URI" <<EOF

// 切换到目标数据库
use ${MONGO_DATABASE};

// 删除已存在的类别（可选，根据需要决定是否保留）
print("检查现有类别...");
const existingCount = db.categories.countDocuments();
print("当前类别数量: " + existingCount);

// 定义10个菜品类别
const categories = [
  {
    name: "凉菜",
    sortOrder: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "热菜",
    sortOrder: 9,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "汤羹",
    sortOrder: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "主食",
    sortOrder: 7,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "小吃",
    sortOrder: 6,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "甜品",
    sortOrder: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "饮品",
    sortOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "海鲜",
    sortOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "素食",
    sortOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "特色菜",
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 逐个插入类别（使用updateOne + upsert避免重复）
let insertedCount = 0;
let updatedCount = 0;
let errorCount = 0;

categories.forEach(category => {
  try {
    const result = db.categories.updateOne(
      { name: category.name },
      { 
        \$set: {
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          updatedAt: new Date()
        },
        \$setOnInsert: {
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
      print("- 类别已存在且未变化: " + category.name);
    }
  } catch (error) {
    errorCount++;
    print("✗ 处理类别失败: " + category.name + " - " + error);
  }
});

print("");
print("================================");
print("初始化完成");
print("================================");
print("新增: " + insertedCount + " 个类别");
print("更新: " + updatedCount + " 个类别");
print("错误: " + errorCount + " 个");
print("总计类别数: " + db.categories.countDocuments());
print("================================");

EOF

# 检查执行结果
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ 菜品类别初始化成功！${NC}"
    echo -e "${GREEN}================================${NC}"
else
    echo ""
    echo -e "${RED}================================${NC}"
    echo -e "${RED}✗ 菜品类别初始化失败！${NC}"
    echo -e "${RED}================================${NC}"
    exit 1
fi
