#!/bin/bash

# 库存管理模块测试脚本
# 测试所有API接口的功能

echo "🧪 开始测试库存管理模块 API..."
echo ""

# 配置
BASE_URL="http://localhost:3001"
TOKEN=""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASS_COUNT=0
FAIL_COUNT=0

# 辅助函数：打印测试结果
print_result() {
    local test_name=$1
    local status=$2
    local response=$3
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  ${RED}响应: $response${NC}"
        ((FAIL_COUNT++))
    fi
}

# 1. 测试用户登录（获取Token）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 1: 用户注册获取Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "barry"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ 注册失败，无法获取Token${NC}"
    echo "响应内容: $REGISTER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ 成功获取Token${NC}"
echo ""

# 2. 测试创建库存项目
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 2: 创建库存项目"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVENTORY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productName": "测试面粉",
    "quantity": 100,
    "lastPrice": 5.5,
    "lowStockThreshold": 20
  }')

INVENTORY_ID=$(echo $INVENTORY_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$INVENTORY_ID" ]; then
    print_result "创建库存项目" "PASS"
    echo "  库存ID: $INVENTORY_ID"
else
    print_result "创建库存项目" "FAIL" "$INVENTORY_RESPONSE"
fi
echo ""

# 3. 测试查询库存列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 3: 查询库存列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/inventory?status=all&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LIST_RESPONSE" | grep -q '"code":0'; then
    print_result "查询库存列表（全部）" "PASS"
else
    print_result "查询库存列表（全部）" "FAIL" "$LIST_RESPONSE"
fi

# 测试低库存列表
LOW_STOCK_RESPONSE=$(curl -s -X GET "$BASE_URL/api/inventory?status=low&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LOW_STOCK_RESPONSE" | grep -q '"code":0'; then
    print_result "查询库存列表（低库存）" "PASS"
else
    print_result "查询库存列表（低库存）" "FAIL" "$LOW_STOCK_RESPONSE"
fi
echo ""

# 4. 测试查询库存详情
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 4: 查询库存详情"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$INVENTORY_ID" ]; then
    DETAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/api/inventory/$INVENTORY_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$DETAIL_RESPONSE" | grep -q '"code":0'; then
        print_result "查询库存详情" "PASS"
    else
        print_result "查询库存详情" "FAIL" "$DETAIL_RESPONSE"
    fi
else
    echo -e "${YELLOW}⊘ 跳过测试（无库存ID）${NC}"
fi
echo ""

# 5. 测试更新库存项目
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 5: 更新库存项目"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$INVENTORY_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/inventory/$INVENTORY_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "productName": "测试面粉（已更新）",
        "lowStockThreshold": 30
      }')
    
    if echo "$UPDATE_RESPONSE" | grep -q '"code":0'; then
        print_result "更新库存项目" "PASS"
    else
        print_result "更新库存项目" "FAIL" "$UPDATE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⊘ 跳过测试（无库存ID）${NC}"
fi
echo ""

# 6. 测试创建进货单
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 6: 创建进货单"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PURCHASE_ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/purchase-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "张三批发商",
    "items": [
      {
        "productName": "测试面粉",
        "quantity": 50,
        "price": 5.0
      },
      {
        "productName": "测试大米",
        "quantity": 30,
        "price": 8.0
      }
    ],
    "remark": "紧急采购"
  }')

ORDER_ID=$(echo $PURCHASE_ORDER_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
    print_result "创建进货单" "PASS"
    echo "  订单ID: $ORDER_ID"
else
    print_result "创建进货单" "FAIL" "$PURCHASE_ORDER_RESPONSE"
fi
echo ""

# 7. 测试查询进货单列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 7: 查询进货单列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ORDER_LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/purchase-order?status=all&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ORDER_LIST_RESPONSE" | grep -q '"code":0'; then
    print_result "查询进货单列表" "PASS"
else
    print_result "查询进货单列表" "FAIL" "$ORDER_LIST_RESPONSE"
fi
echo ""

# 8. 测试审批进货单
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 8: 审批进货单"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$ORDER_ID" ]; then
    APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/purchase-order/$ORDER_ID/approve" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "approve": true,
        "remark": "同意采购"
      }')
    
    if echo "$APPROVE_RESPONSE" | grep -q '"code":0'; then
        print_result "审批进货单（通过）" "PASS"
    else
        print_result "审批进货单（通过）" "FAIL" "$APPROVE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⊘ 跳过测试（无订单ID）${NC}"
fi
echo ""

# 9. 测试入库确认
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 9: 入库确认"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$ORDER_ID" ]; then
    sleep 1  # 等待审批完成
    
    RECEIVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/purchase-order/$ORDER_ID/receive" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "remark": "货物已清点入库"
      }')
    
    if echo "$RECEIVE_RESPONSE" | grep -q '"code":0'; then
        print_result "入库确认" "PASS"
    else
        print_result "入库确认" "FAIL" "$RECEIVE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⊘ 跳过测试（无订单ID）${NC}"
fi
echo ""

# 10. 测试查询库存历史
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 10: 查询库存历史"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/inventory/history/list?changeType=all&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY_RESPONSE" | grep -q '"code":0'; then
    print_result "查询库存历史（全部）" "PASS"
else
    print_result "查询库存历史（全部）" "FAIL" "$HISTORY_RESPONSE"
fi

# 测试按类型查询
PURCHASE_HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/inventory/history/list?changeType=purchase&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PURCHASE_HISTORY_RESPONSE" | grep -q '"code":0'; then
    print_result "查询库存历史（进货）" "PASS"
else
    print_result "查询库存历史（进货）" "FAIL" "$PURCHASE_HISTORY_RESPONSE"
fi
echo ""

# 11. 测试创建损耗记录
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 11: 创建损耗记录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$INVENTORY_ID" ]; then
    LOSS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/inventory-loss" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"inventoryId\": \"$INVENTORY_ID\",
        \"quantity\": 5,
        \"reason\": \"过期\",
        \"remark\": \"已妥善处理\"
      }")
    
    LOSS_ID=$(echo $LOSS_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$LOSS_ID" ]; then
        print_result "创建损耗记录" "PASS"
        echo "  损耗ID: $LOSS_ID"
    else
        print_result "创建损耗记录" "FAIL" "$LOSS_RESPONSE"
    fi
else
    echo -e "${YELLOW}⊘ 跳过测试（无库存ID）${NC}"
fi
echo ""

# 12. 测试查询损耗记录列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 12: 查询损耗记录列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOSS_LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/inventory-loss?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LOSS_LIST_RESPONSE" | grep -q '"code":0'; then
    print_result "查询损耗记录列表" "PASS"
else
    print_result "查询损耗记录列表" "FAIL" "$LOSS_LIST_RESPONSE"
fi
echo ""

# 测试结果汇总
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}通过: $PASS_COUNT${NC}"
echo -e "${RED}失败: $FAIL_COUNT${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "总计: $TOTAL"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  部分测试失败，请检查日志${NC}"
    exit 1
fi
