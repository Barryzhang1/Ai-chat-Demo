#!/bin/bash

# 菜品绑定食材功能测试脚本
# 测试后端API是否正确处理ingredients字段

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/dish"

echo "=========================================="
echo "菜品绑定食材功能测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果输出函数
print_result() {
    local test_name=$1
    local status=$2
    local message=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo -e "  ${RED}$message${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 检查服务是否运行
echo "检查后端服务..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${RED}错误: 后端服务未运行，请先启动服务${NC}"
    echo "运行命令: cd ChatBackEnd && npm run start:dev"
    exit 1
fi
echo -e "${GREEN}后端服务正常运行${NC}"
echo ""

# 获取库存食材ID（用于测试）
echo "获取库存食材ID..."
INVENTORY_RESPONSE=$(curl -s "$BASE_URL/inventory")
INGREDIENT_ID_1=$(echo $INVENTORY_RESPONSE | jq -r '.[0]._id // empty')
INGREDIENT_ID_2=$(echo $INVENTORY_RESPONSE | jq -r '.[1]._id // empty')
INGREDIENT_ID_3=$(echo $INVENTORY_RESPONSE | jq -r '.[2]._id // empty')

if [ -z "$INGREDIENT_ID_1" ]; then
    echo -e "${YELLOW}警告: 未找到库存食材，将使用模拟ID进行测试${NC}"
    INGREDIENT_ID_1="507f1f77bcf86cd799439011"
    INGREDIENT_ID_2="507f191e810c19729de860ea"
    INGREDIENT_ID_3="507f191e810c19729de860eb"
else
    echo -e "${GREEN}找到库存食材: $INGREDIENT_ID_1, $INGREDIENT_ID_2${NC}"
fi
echo ""

# ==================== 测试用例 ====================

echo "=========================================="
echo "1. 创建菜品测试"
echo "=========================================="
echo ""

# 测试1.1: 创建菜品时绑定单个食材
echo "测试 1.1: 创建菜品时绑定单个食材"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试白切鸡\",
    \"price\": 48,
    \"categoryId\": \"test-category-001\",
    \"description\": \"测试菜品\",
    \"tags\": [\"测试\"],
    \"ingredients\": [\"$INGREDIENT_ID_1\"]
  }")

DISH_ID_1=$(echo $RESPONSE | jq -r '._id')
INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients')

if [ "$INGREDIENTS" != "null" ] && echo $INGREDIENTS | grep -q "$INGREDIENT_ID_1"; then
    print_result "创建菜品并绑定单个食材" "PASS"
else
    print_result "创建菜品并绑定单个食材" "FAIL" "ingredients字段不正确: $INGREDIENTS"
fi
echo ""

# 测试1.2: 创建菜品时绑定多个食材
echo "测试 1.2: 创建菜品时绑定多个食材"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试宫保鸡丁\",
    \"price\": 38,
    \"categoryId\": \"test-category-001\",
    \"description\": \"测试菜品\",
    \"ingredients\": [\"$INGREDIENT_ID_1\", \"$INGREDIENT_ID_2\", \"$INGREDIENT_ID_3\"]
  }")

DISH_ID_2=$(echo $RESPONSE | jq -r '._id')
INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients | length')

if [ "$INGREDIENTS" == "3" ]; then
    print_result "创建菜品并绑定多个食材" "PASS"
else
    print_result "创建菜品并绑定多个食材" "FAIL" "ingredients数量不正确: $INGREDIENTS (期望: 3)"
fi
echo ""

# 测试1.3: 创建菜品时不绑定食材
echo "测试 1.3: 创建菜品时不绑定食材"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试清炒时蔬\",
    \"price\": 18,
    \"categoryId\": \"test-category-001\",
    \"description\": \"测试菜品\"
  }")

DISH_ID_3=$(echo $RESPONSE | jq -r '._id')
INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients')

if [ "$INGREDIENTS" == "[]" ] || [ "$INGREDIENTS" == "null" ]; then
    print_result "创建菜品不绑定食材" "PASS"
else
    print_result "创建菜品不绑定食材" "FAIL" "ingredients应为空数组: $INGREDIENTS"
fi
echo ""

# 测试1.4: 创建菜品时传入空数组
echo "测试 1.4: 创建菜品时传入空数组"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试凉拌黄瓜\",
    \"price\": 12,
    \"categoryId\": \"test-category-001\",
    \"ingredients\": []
  }")

DISH_ID_4=$(echo $RESPONSE | jq -r '._id')
INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients')

if [ "$INGREDIENTS" == "[]" ]; then
    print_result "创建菜品传入空数组" "PASS"
else
    print_result "创建菜品传入空数组" "FAIL" "ingredients应为空数组: $INGREDIENTS"
fi
echo ""

echo "=========================================="
echo "2. 更新菜品测试"
echo "=========================================="
echo ""

# 测试2.1: 更新菜品时添加食材
if [ ! -z "$DISH_ID_3" ] && [ "$DISH_ID_3" != "null" ]; then
    echo "测试 2.1: 更新菜品时添加食材"
    RESPONSE=$(curl -s -X PUT "$API_URL/$DISH_ID_3" \
      -H "Content-Type: application/json" \
      -d "{
        \"ingredients\": [\"$INGREDIENT_ID_1\", \"$INGREDIENT_ID_2\"]
      }")
    
    INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients | length')
    
    if [ "$INGREDIENTS" == "2" ]; then
        print_result "更新菜品添加食材" "PASS"
    else
        print_result "更新菜品添加食材" "FAIL" "ingredients数量不正确: $INGREDIENTS (期望: 2)"
    fi
    echo ""
fi

# 测试2.2: 更新菜品时移除部分食材
if [ ! -z "$DISH_ID_2" ] && [ "$DISH_ID_2" != "null" ]; then
    echo "测试 2.2: 更新菜品时移除部分食材"
    RESPONSE=$(curl -s -X PUT "$API_URL/$DISH_ID_2" \
      -H "Content-Type: application/json" \
      -d "{
        \"ingredients\": [\"$INGREDIENT_ID_1\"]
      }")
    
    INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients | length')
    
    if [ "$INGREDIENTS" == "1" ]; then
        print_result "更新菜品移除部分食材" "PASS"
    else
        print_result "更新菜品移除部分食材" "FAIL" "ingredients数量不正确: $INGREDIENTS (期望: 1)"
    fi
    echo ""
fi

# 测试2.3: 更新菜品时清空所有食材
if [ ! -z "$DISH_ID_1" ] && [ "$DISH_ID_1" != "null" ]; then
    echo "测试 2.3: 更新菜品时清空所有食材"
    RESPONSE=$(curl -s -X PUT "$API_URL/$DISH_ID_1" \
      -H "Content-Type: application/json" \
      -d "{
        \"ingredients\": []
      }")
    
    INGREDIENTS=$(echo $RESPONSE | jq -r '.ingredients')
    
    if [ "$INGREDIENTS" == "[]" ]; then
        print_result "更新菜品清空所有食材" "PASS"
    else
        print_result "更新菜品清空所有食材" "FAIL" "ingredients应为空数组: $INGREDIENTS"
    fi
    echo ""
fi

echo "=========================================="
echo "3. 查询菜品测试"
echo "=========================================="
echo ""

# 测试3.1: 查询单个菜品返回ingredients字段
if [ ! -z "$DISH_ID_2" ] && [ "$DISH_ID_2" != "null" ]; then
    echo "测试 3.1: 查询单个菜品返回ingredients字段"
    RESPONSE=$(curl -s "$API_URL/$DISH_ID_2")
    
    HAS_INGREDIENTS=$(echo $RESPONSE | jq 'has("ingredients")')
    
    if [ "$HAS_INGREDIENTS" == "true" ]; then
        print_result "查询单个菜品返回ingredients字段" "PASS"
    else
        print_result "查询单个菜品返回ingredients字段" "FAIL" "缺少ingredients字段"
    fi
    echo ""
fi

# 测试3.2: 查询菜品列表返回ingredients字段
echo "测试 3.2: 查询菜品列表返回ingredients字段"
RESPONSE=$(curl -s "$API_URL")

# 检查第一个菜品是否有ingredients字段
HAS_INGREDIENTS=$(echo $RESPONSE | jq '.[0] | has("ingredients")')

if [ "$HAS_INGREDIENTS" == "true" ]; then
    print_result "查询菜品列表返回ingredients字段" "PASS"
else
    print_result "查询菜品列表返回ingredients字段" "FAIL" "列表中的菜品缺少ingredients字段"
fi
echo ""

echo "=========================================="
echo "4. 数据清理"
echo "=========================================="
echo ""

# 清理测试数据
echo "清理测试数据..."
for DISH_ID in $DISH_ID_1 $DISH_ID_2 $DISH_ID_3 $DISH_ID_4; do
    if [ ! -z "$DISH_ID" ] && [ "$DISH_ID" != "null" ]; then
        # 注意：需要确保后端有DELETE接口，如果没有则跳过清理
        # curl -s -X DELETE "$API_URL/$DISH_ID" > /dev/null 2>&1
        echo "  已创建测试菜品: $DISH_ID (需手动清理)"
    fi
done
echo ""

echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "总测试数: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 部分测试失败，请检查${NC}"
    exit 1
fi
