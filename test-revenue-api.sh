#!/bin/bash

# 收入管理系统快速测试脚本
# 使用方法: ./test-revenue-api.sh

API_BASE_URL="http://localhost:3001/api"
TOKEN="" # 替换为实际的 BOSS Token

echo "🧪 收入管理系统 API 测试"
echo "================================"
echo ""

# 检查是否设置了 TOKEN
if [ -z "$TOKEN" ]; then
  echo "❌ 错误: 请先设置 BOSS Token"
  echo "   在脚本中修改 TOKEN 变量"
  exit 1
fi

# 1. 测试当日收入统计
echo "📊 测试 1: 查询当日收入统计"
echo "GET ${API_BASE_URL}/revenue/stats/today"
curl -X GET "${API_BASE_URL}/revenue/stats/today" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

# 2. 测试月度收入统计
echo "📊 测试 2: 查询月度收入统计"
echo "GET ${API_BASE_URL}/revenue/stats/month"
curl -X GET "${API_BASE_URL}/revenue/stats/month" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

# 3. 测试总体收入统计
echo "📊 测试 3: 查询总体收入统计"
echo "GET ${API_BASE_URL}/revenue/stats/total"
curl -X GET "${API_BASE_URL}/revenue/stats/total" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

# 4. 测试批量创建额外收支
echo "💰 测试 4: 批量创建额外收支"
echo "POST ${API_BASE_URL}/revenue/transactions/batch"
TODAY=$(date +%Y-%m-%d)
curl -X POST "${API_BASE_URL}/revenue/transactions/batch" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"transactions\": [
      {
        \"type\": \"expense\",
        \"amount\": 5000.00,
        \"category\": \"房租\",
        \"description\": \"测试：店铺租金\",
        \"transactionDate\": \"${TODAY}\"
      },
      {
        \"type\": \"expense\",
        \"amount\": 800.00,
        \"category\": \"水电费\",
        \"description\": \"测试：水电费用\",
        \"transactionDate\": \"${TODAY}\"
      },
      {
        \"type\": \"income\",
        \"amount\": 500.00,
        \"category\": \"其他收入\",
        \"description\": \"测试：额外收入\",
        \"transactionDate\": \"${TODAY}\"
      }
    ]
  }" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

# 5. 测试查询收支列表
echo "📝 测试 5: 查询额外收支列表"
echo "GET ${API_BASE_URL}/revenue/transactions?page=1&pageSize=10"
curl -X GET "${API_BASE_URL}/revenue/transactions?page=1&pageSize=10" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

# 6. 测试按类型筛选
echo "🔍 测试 6: 按类型筛选（仅支出）"
echo "GET ${API_BASE_URL}/revenue/transactions?type=expense"
curl -X GET "${API_BASE_URL}/revenue/transactions?type=expense" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

# 7. 测试权限控制（使用错误的 Token）
echo "🔒 测试 7: 权限控制测试（应该返回 403）"
echo "GET ${API_BASE_URL}/revenue/stats/today (with invalid token)"
curl -X GET "${API_BASE_URL}/revenue/stats/today" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""
echo "================================"
echo ""

echo "✅ 测试完成！"
echo ""
echo "📋 测试说明:"
echo "   1-3: 收入统计接口测试"
echo "   4: 批量创建额外收支测试"
echo "   5-6: 查询和筛选测试"
echo "   7: 权限控制测试"
echo ""
echo "💡 提示:"
echo "   - 如果看到 401/403 错误，请检查 Token 是否正确"
echo "   - 如果看到 404 错误，请检查后端服务是否启动"
echo "   - 测试 4 创建的数据可以在测试 5-6 中看到"
