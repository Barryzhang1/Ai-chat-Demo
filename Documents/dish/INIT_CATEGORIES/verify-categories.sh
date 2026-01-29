#!/bin/bash

# 菜品类别验证脚本
# 用于验证初始化结果是否正确

CONTAINER_NAME="chat-mongodb"
USE_DOCKER=false

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --docker)
      USE_DOCKER=true
      shift
      ;;
    *)
      echo "未知参数: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}菜品类别验证脚本${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 定义验证SQL
VERIFY_SCRIPT='
print("📊 类别统计信息");
print("================================");
const count = db.categories.countDocuments();
print("总类别数: " + count);

if (count !== 10) {
  print("⚠️  警告: 期望10个类别，实际" + count + "个");
}

print("");
print("📋 类别列表（按sortOrder排序）");
print("================================");
const categories = db.categories.find().sort({sortOrder: -1}).toArray();
categories.forEach((cat, index) => {
  const status = cat.isActive ? "✅ 启用" : "❌ 禁用";
  print((index + 1) + ". " + cat.name.padEnd(10) + " | sortOrder: " + cat.sortOrder + " | " + status);
});

print("");
print("🔍 数据完整性检查");
print("================================");

// 检查重复
const duplicates = db.categories.aggregate([
  {$group: {_id: "$name", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
]).toArray();

if (duplicates.length > 0) {
  print("❌ 发现重复类别:");
  duplicates.forEach(d => print("  - " + d._id + " (出现" + d.count + "次)"));
} else {
  print("✅ 无重复类别");
}

// 检查必填字段
const missingFields = db.categories.find({
  $or: [
    {name: {$exists: false}},
    {sortOrder: {$exists: false}},
    {isActive: {$exists: false}}
  ]
}).count();

if (missingFields > 0) {
  print("❌ 发现" + missingFields + "个类别缺少必填字段");
} else {
  print("✅ 所有类别字段完整");
}

// 检查sortOrder唯一性
const sortOrders = db.categories.distinct("sortOrder");
if (sortOrders.length === count) {
  print("✅ sortOrder值唯一");
} else {
  print("⚠️  sortOrder有重复值");
}

// 检查预期类别
print("");
print("🎯 预期类别验证");
print("================================");
const expectedCategories = [
  {name: "凉菜", sortOrder: 10},
  {name: "热菜", sortOrder: 9},
  {name: "汤羹", sortOrder: 8},
  {name: "主食", sortOrder: 7},
  {name: "小吃", sortOrder: 6},
  {name: "甜品", sortOrder: 5},
  {name: "饮品", sortOrder: 4},
  {name: "海鲜", sortOrder: 3},
  {name: "素食", sortOrder: 2},
  {name: "特色菜", sortOrder: 1}
];

let allMatch = true;
expectedCategories.forEach(expected => {
  const found = db.categories.findOne({name: expected.name});
  if (!found) {
    print("❌ 缺少类别: " + expected.name);
    allMatch = false;
  } else if (found.sortOrder !== expected.sortOrder) {
    print("⚠️  " + expected.name + " sortOrder不匹配: 期望" + expected.sortOrder + "，实际" + found.sortOrder);
    allMatch = false;
  } else {
    print("✅ " + expected.name);
  }
});

if (allMatch && count === 10) {
  print("");
  print("================================");
  print("🎉 所有验证通过！");
  print("================================");
} else {
  print("");
  print("================================");
  print("⚠️  存在问题，请检查");
  print("================================");
}
'

# 执行验证
if [ "$USE_DOCKER" = true ]; then
    echo -e "${YELLOW}使用Docker模式验证...${NC}"
    echo ""
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "${RED}错误: MongoDB容器未运行${NC}"
        exit 1
    fi
    
    docker exec -i "$CONTAINER_NAME" mongosh -u root -p password --authenticationDatabase admin restaurant --quiet --eval "$VERIFY_SCRIPT"
else
    echo -e "${YELLOW}使用本地模式验证...${NC}"
    echo ""
    
    MONGO_HOST=${MONGO_HOST:-localhost}
    MONGO_PORT=${MONGO_PORT:-27017}
    MONGO_USER=${MONGO_USER:-root}
    MONGO_PASSWORD=${MONGO_PASSWORD:-password}
    MONGO_DATABASE=${MONGO_DATABASE:-restaurant}
    MONGO_AUTH_SOURCE=${MONGO_AUTH_SOURCE:-admin}
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASSWORD" ]; then
        MONGO_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}?authSource=${MONGO_AUTH_SOURCE}"
    else
        MONGO_URI="mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}"
    fi
    
    mongosh "$MONGO_URI" --quiet --eval "$VERIFY_SCRIPT"
fi

echo ""
