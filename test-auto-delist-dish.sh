#!/bin/bash

# 菜品自动下架功能测试脚本

API_BASE_URL="http://localhost:3001"

echo "========================================"
echo "菜品自动下架功能测试"
echo "========================================"
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

# 测试函数
run_test() {
  local test_name=$1
  local expected_status=$2
  local response=$3
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if [[ $response == *"$expected_status"* ]]; then
    echo -e "${GREEN}✓ PASS${NC}: $test_name"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $test_name"
    echo "Response: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
}

# 准备测试数据
echo "========== 准备测试数据 =========="
echo ""

# 1. 创建测试食材（库存为0）
echo "1. 创建库存为0的测试食材..."
INGREDIENT_ZERO=$(curl -s -X POST "$API_BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "测试食材_库存为0",
    "quantity": 0,
    "unit": "份",
    "lastPrice": 10
  }')
INGREDIENT_ZERO_ID=$(echo $INGREDIENT_ZERO | grep -o '"_id":"[^"]*"' | sed 's/"_id":"\(.*\)"/\1/')
echo "创建成功，ID: $INGREDIENT_ZERO_ID"
echo ""

# 2. 创建测试食材（库存充足）
echo "2. 创建库存充足的测试食材..."
INGREDIENT_SUFFICIENT=$(curl -s -X POST "$API_BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "测试食材_库存充足",
    "quantity": 100,
    "unit": "份",
    "lastPrice": 15
  }')
INGREDIENT_SUFFICIENT_ID=$(echo $INGREDIENT_SUFFICIENT | grep -o '"_id":"[^"]*"' | sed 's/"_id":"\(.*\)"/\1/')
echo "创建成功，ID: $INGREDIENT_SUFFICIENT_ID"
echo ""

# 3. 创建测试菜品（上架状态）
echo "3. 创建测试菜品（上架状态）..."
DISH=$(curl -s -X POST "$API_BASE_URL/dish" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试菜品_自动下架",
    "price": 38,
    "categoryId": "test-category",
    "description": "用于测试自动下架功能",
    "isDelisted": false
  }')
DISH_ID=$(echo $DISH | grep -o '"_id":"[^"]*"' | sed 's/"_id":"\(.*\)"/\1/')
echo "创建成功，ID: $DISH_ID"
echo ""

sleep 2

echo "========== 开始测试 =========="
echo ""

# 测试用例 1：绑定单个数量为0的食材
echo "【测试用例 1】绑定单个数量为0的食材，验证自动下架"
RESPONSE=$(curl -s -X PUT "$API_BASE_URL/dish/$DISH_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"ingredients\": [\"$INGREDIENT_ZERO_ID\"]
  }")
echo "响应: $RESPONSE"

# 验证菜品是否自动下架
if [[ $RESPONSE == *"\"isDelisted\":true"* ]]; then
  run_test "测试用例1: 绑定数量为0的食材应自动下架" "isDelisted\":true" "$RESPONSE"
else
  run_test "测试用例1: 绑定数量为0的食材应自动下架" "isDelisted\":true" "$RESPONSE"
fi

# 测试用例 2：绑定多个食材，其中一个数量为0
echo "【测试用例 2】绑定多个食材，其中一个数量为0，验证自动下架"

# 先创建另一个菜品
DISH2=$(curl -s -X POST "$API_BASE_URL/dish" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试菜品2_自动下架",
    "price": 48,
    "categoryId": "test-category",
    "description": "用于测试自动下架功能",
    "isDelisted": false
  }')
DISH2_ID=$(echo $DISH2 | grep -o '"_id":"[^"]*"' | sed 's/"_id":"\(.*\)"/\1/')

RESPONSE2=$(curl -s -X PUT "$API_BASE_URL/dish/$DISH2_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"ingredients\": [\"$INGREDIENT_SUFFICIENT_ID\", \"$INGREDIENT_ZERO_ID\"]
  }")
echo "响应: $RESPONSE2"

if [[ $RESPONSE2 == *"\"isDelisted\":true"* ]]; then
  run_test "测试用例2: 绑定多个食材（含数量为0）应自动下架" "isDelisted\":true" "$RESPONSE2"
else
  run_test "测试用例2: 绑定多个食材（含数量为0）应自动下架" "isDelisted\":true" "$RESPONSE2"
fi

# 测试用例 3：绑定的所有食材库存都充足
echo "【测试用例 3】绑定的所有食材库存都充足，验证不自动下架"

# 创建第三个菜品
DISH3=$(curl -s -X POST "$API_BASE_URL/dish" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试菜品3_不下架",
    "price": 58,
    "categoryId": "test-category",
    "description": "用于测试不下架场景",
    "isDelisted": false
  }')
DISH3_ID=$(echo $DISH3 | grep -o '"_id":"[^"]*"' | sed 's/"_id":"\(.*\)"/\1/')

RESPONSE3=$(curl -s -X PUT "$API_BASE_URL/dish/$DISH3_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"ingredients\": [\"$INGREDIENT_SUFFICIENT_ID\"]
  }")
echo "响应: $RESPONSE3"

if [[ $RESPONSE3 == *"\"isDelisted\":false"* ]]; then
  run_test "测试用例3: 绑定库存充足的食材不应自动下架" "isDelisted\":false" "$RESPONSE3"
else
  run_test "测试用例3: 绑定库存充足的食材不应自动下架" "isDelisted\":false" "$RESPONSE3"
fi

# 测试用例 4：清空食材绑定
echo "【测试用例 4】清空食材绑定，验证状态不变"
RESPONSE4=$(curl -s -X PUT "$API_BASE_URL/dish/$DISH3_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": []
  }')
echo "响应: $RESPONSE4"

if [[ $RESPONSE4 == *"\"isDelisted\":false"* ]]; then
  run_test "测试用例4: 清空食材绑定状态应保持不变" "isDelisted\":false" "$RESPONSE4"
else
  run_test "测试用例4: 清空食材绑定状态应保持不变" "isDelisted\":false" "$RESPONSE4"
fi

echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}✗ 有测试失败，请检查！${NC}"
  exit 1
fi
