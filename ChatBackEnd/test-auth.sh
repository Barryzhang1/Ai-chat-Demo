#!/bin/bash

echo "======================================"
echo "运行认证模块单元测试"
echo "======================================"

npm test -- --testPathPattern=auth --verbose

echo ""
echo "======================================"
echo "运行认证模块E2E测试"
echo "======================================"

npm run test:e2e -- --testPathPattern=auth --verbose
