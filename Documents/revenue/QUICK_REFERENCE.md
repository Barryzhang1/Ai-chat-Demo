# 精确成本核算 - 快速参考卡片

## 🎯 核心公式

```
毛利额 = 销售收入 - 销售成本
毛利率 = (毛利额 ÷ 销售收入) × 100%
销售成本 = Σ(菜品成本 × 菜品数量)
菜品成本 = Σ(绑定食材的最新进货价格)
```

## 📊 API响应示例

```json
GET /api/revenue/stats/today

{
  "revenue": 3580.00,       // 销售收入
  "materialCost": 2706.00,  // 🆕 实际原材料成本
  "cost": 2906.00,          // 总成本
  "grossProfit": 874.00,    // 毛利额
  "grossMarginRate": 24.41, // 🆕 动态毛利率
  "netProfit": 674.00,      // 净利润
  "orderCount": 25,
  "extraIncome": 0.00,
  "extraExpense": 200.00
}
```

## 🔧 修改的文件

### Backend (2个)
- `ChatBackEnd/src/modules/revenue/revenue.module.ts`
- `ChatBackEnd/src/modules/revenue/revenue.service.ts`

### Documentation (4个)
- `Documents/revenue/revenue.implementation.md` ✏️ 更新
- `Documents/revenue/revenue.testcase.md` ✏️ 更新
- `Documents/revenue/cost-calculation-upgrade.md` 🆕 新建
- `Documents/revenue/implementation-summary.md` 🆕 新建

## ⚡ 核心代码

```typescript
// 计算菜品成本
async calculateDishCost(dishId) {
  const dish = await Dish.findById(dishId);
  const ingredients = await Inventory.find({
    _id: { $in: dish.ingredients }
  });
  return ingredients.reduce((sum, ing) => sum + ing.lastPrice, 0);
}

// 计算订单成本
async calculateOrdersCost(orders) {
  let total = 0;
  for (const order of orders) {
    for (const item of order.dishes) {
      total += await calculateDishCost(item.dishId) * item.quantity;
    }
  }
  return total;
}
```

## ✅ 验收清单

- [x] 代码编译通过
- [x] TypeScript类型检查通过
- [x] 无ESLint错误
- [x] 财务公式正确
- [x] 文档更新完整
- [ ] ⏳ 运行时测试（待执行）

## 🧪 测试命令

```bash
# 1. 启动服务
cd ChatBackEnd
npm run start:dev

# 2. 测试API
curl -X GET "http://localhost:3001/api/revenue/stats/today" \
  -H "Authorization: Bearer YOUR_BOSS_TOKEN"

# 3. 验证响应包含 materialCost 字段
```

## 📝 注意事项

⚠️ **数据依赖**
- 菜品必须绑定食材才能计算成本
- 未绑定食材的菜品成本为0（毛利率100%）
- 使用库存中的 `lastPrice` 字段

💡 **最佳实践**
- 为所有菜品绑定对应食材
- 定期更新食材进货价格
- 监控低利润菜品

## 🚀 下一步

1. ⏳ 启动后端服务测试
2. ⏳ 准备测试数据
3. ⏳ 验证计算准确性
4. 📋 完善菜品食材绑定

## 📚 文档链接

- [实施总结](./implementation-summary.md)
- [升级说明](./cost-calculation-upgrade.md)
- [实现文档](./revenue.implementation.md)
- [测试用例](./revenue.testcase.md)

---

**升级完成**: 2026-02-01  
**状态**: ✅ 代码完成，待测试
