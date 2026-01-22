#!/bin/bash

# DeepSeek API 测试脚本
# 用于验证 API 是否正常工作

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 开始测试 DeepSeek API..."
echo ""

# 测试 1: 检查服务器状态
echo "测试 1: 检查服务器状态"
echo "URL: GET ${BASE_URL}/deepseek/status"
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/deepseek/status")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "响应: $body"
else
    echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
fi
echo ""

# 测试 2: 获取建议
echo "测试 2: 获取建议"
echo "URL: POST ${BASE_URL}/deepseek/suggest"
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/deepseek/suggest" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "什么是 JavaScript 闭包？"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "响应: $body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
fi
echo ""

# 测试 3: 解释代码
echo "测试 3: 解释代码"
echo "URL: POST ${BASE_URL}/deepseek/explain"
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/deepseek/explain" \
  -H "Content-Type: application/json" \
  -d '{"code": "const add = (a, b) => a + b;"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "响应: $body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
fi
echo ""

# 测试 4: 执行自定义命令
echo "测试 4: 执行自定义命令"
echo "URL: POST ${BASE_URL}/deepseek/execute"
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/deepseek/execute" \
  -H "Content-Type: application/json" \
  -d '{"command": "解释什么是 REST API", "args": []}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "响应: $body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
fi
echo ""

echo "✅ 测试完成"
