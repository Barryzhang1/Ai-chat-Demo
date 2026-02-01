#!/bin/bash

# 进货管理权限控制测试脚本
# 测试只有BOSS权限才能审批进货单

echo "🔒 开始测试进货单审批权限控制..."
echo ""

# 配置
BASE_URL="http://localhost:3001"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 1. 创建BOSS用户并获取Token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 1: 创建BOSS用户"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BOSS_REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "boss_user_test"
  }')

BOSS_TOKEN=$(echo $BOSS_REGISTER | grep -o '"token":"[^"]*' | cut -d'"' -f4)
BOSS_USER_ID=$(echo $BOSS_REGISTER | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$BOSS_TOKEN" ] && [ -n "$BOSS_USER_ID" ]; then
    echo -e "${GREEN}✓${NC} BOSS用户创建成功"
    echo -e "  User ID: $BOSS_USER_ID"
    
    # 将用户角色更新为BOSS
    UPDATE_ROLE=$(curl -s -X PUT "$BASE_URL/api/users/$BOSS_USER_ID/role" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $BOSS_TOKEN" \
      -d '{
        "role": "BOSS"
      }')
    
    echo -e "${GREEN}✓${NC} 用户角色已更新为BOSS"
    
    # 重新登录获取新的Token（包含BOSS角色）
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"userId\": \"$BOSS_USER_ID\"
      }")
    
    BOSS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} BOSS Token已更新"
else
    echo -e "${RED}✗${NC} BOSS用户创建失败"
    exit 1
fi
echo ""

# 2. 创建STAFF用户并获取Token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 2: 创建STAFF用户"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STAFF_REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "staff_user_test"
  }')

STAFF_TOKEN=$(echo $STAFF_REGISTER | grep -o '"token":"[^"]*' | cut -d'"' -f4)
STAFF_USER_ID=$(echo $STAFF_REGISTER | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$STAFF_TOKEN" ] && [ -n "$STAFF_USER_ID" ]; then
    echo -e "${GREEN}✓${NC} STAFF用户创建成功"
    echo -e "  User ID: $STAFF_USER_ID"
    
    # 将用户角色更新为STAFF
    UPDATE_ROLE=$(curl -s -X PUT "$BASE_URL/api/users/$STAFF_USER_ID/role" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $BOSS_TOKEN" \
      -d '{
        "role": "STAFF"
      }')
    
    echo -e "${GREEN}✓${NC} 用户角色已更新为STAFF"
    
    # 重新登录获取新的Token（包含STAFF角色）
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"userId\": \"$STAFF_USER_ID\"
      }")
    
    STAFF_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} STAFF Token已更新"
else
    echo -e "${RED}✗${NC} STAFF用户创建失败"
    exit 1
fi
echo ""

# 3. 创建USER用户并获取Token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 3: 创建USER用户"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

USER_REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "normal_user_test"
  }')

USER_TOKEN=$(echo $USER_REGISTER | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$USER_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} USER用户创建成功（默认角色为USER）"
else
    echo -e "${RED}✗${NC} USER用户创建失败"
    exit 1
fi
echo ""

# 4. 使用BOSS账号创建进货单
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 4: 创建进货单（使用BOSS账号）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CREATE_ORDER=$(curl -s -X POST "$BASE_URL/api/purchase-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOSS_TOKEN" \
  -d '{
    "supplierName": "测试供应商-权限测试",
    "remark": "权限控制测试进货单",
    "items": [
      {
        "productName": "测试商品A",
        "quantity": 50,
        "price": 10.00
      }
    ]
  }')

ORDER_ID=$(echo $CREATE_ORDER | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
    print_result "创建进货单" "PASS"
    echo -e "  ${BLUE}Order ID: $ORDER_ID${NC}"
else
    print_result "创建进货单" "FAIL" "$CREATE_ORDER"
    exit 1
fi
echo ""

# 5. 测试BOSS用户审批进货单（应该成功）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 5: BOSS用户审批进货单（应该成功）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BOSS_APPROVE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/purchase-order/$ORDER_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOSS_TOKEN" \
  -d '{
    "approve": true,
    "remark": "BOSS批准"
  }')

HTTP_STATUS=$(echo "$BOSS_APPROVE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$BOSS_APPROVE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" = "200" ] && echo "$RESPONSE_BODY" | grep -q '"code":0'; then
    print_result "BOSS用户批准进货单" "PASS"
else
    print_result "BOSS用户批准进货单" "FAIL" "HTTP $HTTP_STATUS - $RESPONSE_BODY"
fi
echo ""

# 6. 创建另一个进货单用于STAFF测试
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 6: 创建第二个进货单（用于STAFF测试）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CREATE_ORDER2=$(curl -s -X POST "$BASE_URL/api/purchase-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{
    "supplierName": "测试供应商-STAFF测试",
    "remark": "STAFF权限测试",
    "items": [
      {
        "productName": "测试商品B",
        "quantity": 30,
        "price": 15.00
      }
    ]
  }')

ORDER_ID2=$(echo $CREATE_ORDER2 | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID2" ]; then
    print_result "创建第二个进货单" "PASS"
    echo -e "  ${BLUE}Order ID: $ORDER_ID2${NC}"
else
    print_result "创建第二个进货单" "FAIL" "$CREATE_ORDER2"
fi
echo ""

# 7. 测试STAFF用户审批进货单（应该失败，返回403）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 7: STAFF用户审批进货单（应该失败-403）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STAFF_APPROVE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/purchase-order/$ORDER_ID2/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{
    "approve": true,
    "remark": "STAFF尝试批准"
  }')

HTTP_STATUS=$(echo "$STAFF_APPROVE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$STAFF_APPROVE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" = "403" ]; then
    print_result "STAFF用户审批进货单（应返回403）" "PASS"
    echo -e "  ${BLUE}预期行为：权限不足${NC}"
else
    print_result "STAFF用户审批进货单（应返回403）" "FAIL" "HTTP $HTTP_STATUS - 预期403，实际$HTTP_STATUS"
fi
echo ""

# 8. 创建第三个进货单用于USER测试
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 8: 创建第三个进货单（用于USER测试）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CREATE_ORDER3=$(curl -s -X POST "$BASE_URL/api/purchase-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOSS_TOKEN" \
  -d '{
    "supplierName": "测试供应商-USER测试",
    "remark": "USER权限测试",
    "items": [
      {
        "productName": "测试商品C",
        "quantity": 20,
        "price": 20.00
      }
    ]
  }')

ORDER_ID3=$(echo $CREATE_ORDER3 | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID3" ]; then
    print_result "创建第三个进货单" "PASS"
    echo -e "  ${BLUE}Order ID: $ORDER_ID3${NC}"
else
    print_result "创建第三个进货单" "FAIL" "$CREATE_ORDER3"
fi
echo ""

# 9. 测试USER用户审批进货单（应该失败，返回403）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 9: USER用户审批进货单（应该失败-403）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

USER_APPROVE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/purchase-order/$ORDER_ID3/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "approve": true,
    "remark": "USER尝试批准"
  }')

HTTP_STATUS=$(echo "$USER_APPROVE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$USER_APPROVE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" = "403" ]; then
    print_result "USER用户审批进货单（应返回403）" "PASS"
    echo -e "  ${BLUE}预期行为：权限不足${NC}"
else
    print_result "USER用户审批进货单（应返回403）" "FAIL" "HTTP $HTTP_STATUS - 预期403，实际$HTTP_STATUS"
fi
echo ""

# 10. 测试未登录用户审批进货单（应该失败，返回401）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤 10: 未登录用户审批进货单（应该失败-401）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NO_AUTH_APPROVE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/purchase-order/$ORDER_ID3/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "approve": true,
    "remark": "未授权尝试批准"
  }')

HTTP_STATUS=$(echo "$NO_AUTH_APPROVE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$NO_AUTH_APPROVE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" = "401" ]; then
    print_result "未登录用户审批进货单（应返回401）" "PASS"
    echo -e "  ${BLUE}预期行为：未授权${NC}"
else
    print_result "未登录用户审批进货单（应返回401）" "FAIL" "HTTP $HTTP_STATUS - 预期401，实际$HTTP_STATUS"
fi
echo ""

# 打印测试总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}通过: $PASS_COUNT${NC}"
echo -e "${RED}失败: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！进货单审批权限控制正常工作。${NC}"
    exit 0
else
    echo -e "${RED}❌ 部分测试失败，请检查问题。${NC}"
    exit 1
fi
