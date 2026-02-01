# 收入管理系统 - 精确成本核算升级说明

## 📅 升级日期
2026-02-01

## 🎯 升级目标
将收入管理系统的成本计算方式从"固定毛利率"升级为"基于菜品-食材绑定关系的精确成本计算"。

---

## 📊 升级对比

### 升级前：固定毛利率方案

```typescript
// 固定毛利率 30%
const GROSS_MARGIN_RATE = 0.3;

// 销售成本 = 收入 × 70%
const materialCost = revenue * (1 - GROSS_MARGIN_RATE);

// 毛利额 = 收入 × 30%
const grossProfit = revenue * GROSS_MARGIN_RATE;

// 毛利率 = 30% (固定)
const grossMarginRate = 30.00;
```

**问题**：
- ❌ 无法反映不同菜品的真实成本差异
- ❌ 无法追踪食材价格波动
- ❌ 毛利率固定，不符合实际经营情况
- ❌ 无法为菜单定价提供数据支持

---

### 升级后：精确成本核算方案

```typescript
// 1. 计算单个菜品成本
async calculateDishCost(dishId) {
  const dish = await Dish.findById(dishId);
  const ingredients = await Inventory.find({
    _id: { $in: dish.ingredients }
  });
  
  // 成本 = 各食材最新进货价格之和
  return ingredients.reduce((sum, ing) => sum + ing.lastPrice, 0);
}

// 2. 计算订单成本
for (const order of orders) {
  for (const dishItem of order.dishes) {
    const dishCost = await calculateDishCost(dishItem.dishId);
    totalCost += dishCost * dishItem.quantity;
  }
}

// 3. 计算财务指标
毛利额 = 销售收入 - 实际销售成本
毛利率 = (毛利额 ÷ 销售收入) × 100%
净利润 = 毛利额 - 额外支出 + 额外收入
```

**优势**：
- ✅ 真实反映各菜品的实际成本和利润率
- ✅ 自动追踪食材价格波动对利润的影响
- ✅ 为菜单定价优化提供数据支持
- ✅ 支持成本趋势分析和毛利率监控
- ✅ 可识别高成本、低利润的菜品

---

## 🔧 技术实现

### 1. 修改的文件

#### Backend
```
ChatBackEnd/src/modules/revenue/
├── revenue.module.ts           # 导入 Dish 和 Inventory 模块
├── revenue.service.ts          # 新增成本计算方法，修改财务指标计算逻辑
└── (无需修改 DTO 和 Entity)
```

#### Documentation
```
Documents/revenue/
├── revenue.implementation.md   # 更新实现说明
├── revenue.testcase.md         # 新增成本核算测试用例
└── cost-calculation-upgrade.md # 本升级说明文档
```

### 2. 核心代码变更

**revenue.module.ts**
```typescript
// 新增导入
import { Dish, DishSchema } from '../dish/entities/dish.entity';
import { Inventory, InventorySchema } from '../inventory/entities/inventory.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      // ... 原有的
      { name: Dish.name, schema: DishSchema },          // 新增
      { name: Inventory.name, schema: InventorySchema }, // 新增
    ]),
  ],
  // ...
})
```

**revenue.service.ts**
```typescript
// 新增：注入 Dish 和 Inventory 模型
constructor(
  @InjectModel(ExtraTransaction.name)
  private readonly extraTransactionModel: Model<ExtraTransactionDocument>,
  @InjectModel(Order.name)
  private readonly orderModel: Model<OrderDocument>,
  @InjectModel(Dish.name)                              // 新增
  private readonly dishModel: Model<DishDocument>,     // 新增
  @InjectModel(Inventory.name)                         // 新增
  private readonly inventoryModel: Model<InventoryDocument>, // 新增
) {}

// 新增方法：计算单个菜品成本
private async calculateDishCost(dishId: Types.ObjectId): Promise<number>

// 新增方法：计算订单列表成本
private async calculateOrdersCost(orders: OrderDocument[]): Promise<number>

// 修改方法：财务指标计算
private calculateFinancialMetrics(
  revenue: number,
  actualMaterialCost: number,  // 参数变更
  extraIncome: number,
  extraExpense: number,
)

// 修改方法：统计接口
async getTodayStats(date?: string)   // 使用实际成本
async getMonthStats(date?: string)   // 使用实际成本
async getTotalStats()                // 使用实际成本

// 删除方法
// ❌ getOrderRevenue() - 不再需要单独的订单收入方法
```

---

## 📋 API 响应变化

### 新增字段

所有统计接口（`/today`, `/month`, `/total`）的响应中新增：

```json
{
  "materialCost": 2706.00  // 实际原材料成本
}
```

### 字段含义变化

```json
{
  "grossMarginRate": 24.41  // 从固定30%变为动态计算
}
```

**计算公式**：
- 旧：`grossMarginRate = 30.00` （常量）
- 新：`grossMarginRate = (grossProfit / revenue) × 100`

---

## 🧪 测试验证

### 测试场景 1：基础成本计算

**数据准备**：
- 食材：鸡肉(¥20)、花生(¥8)、辣椒(¥5)
- 菜品：宫保鸡丁（售价¥48，绑定以上3种食材）
- 订单：1份宫保鸡丁

**预期结果**：
```json
{
  "revenue": 48.00,
  "materialCost": 33.00,      // 20 + 8 + 5
  "grossProfit": 15.00,       // 48 - 33
  "grossMarginRate": 31.25    // (15 / 48) × 100
}
```

### 测试场景 2：未绑定食材

**数据准备**：
- 菜品：特色饮料（售价¥15，未绑定食材）

**预期结果**：
```json
{
  "revenue": 15.00,
  "materialCost": 0.00,       // 无绑定食材
  "grossProfit": 15.00,
  "grossMarginRate": 100.00   // 全部为利润
}
```

### 测试场景 3：混合订单

**数据准备**：
- 订单：2份宫保鸡丁(¥96) + 1份饮料(¥15)

**预期结果**：
```json
{
  "revenue": 111.00,          // 96 + 15
  "materialCost": 66.00,      // 33 × 2 + 0
  "grossProfit": 45.00,       // 111 - 66
  "grossMarginRate": 40.54    // (45 / 111) × 100
}
```

---

## ⚠️ 注意事项

### 1. 前置依赖

**必须满足**：
- ✅ 菜品管理模块已实现菜品-食材绑定功能
- ✅ 库存管理模块记录食材的最新进货价格
- ✅ 订单模块正常运行

### 2. 数据完整性

**建议操作**：
- 📋 为所有在售菜品绑定对应的食材
- 📋 确保库存食材的 `lastPrice` 字段准确
- 📋 定期更新食材进货价格

**风险提示**：
- ⚠️ 未绑定食材的菜品成本为0，会导致毛利率偏高
- ⚠️ 食材价格未更新会影响成本准确性
- ⚠️ 已删除的食材不计入成本

### 3. 性能考虑

**当前实现**：
- 每次统计都实时计算成本
- 大量订单时可能影响查询速度（>1000订单）

**优化建议**（可选）：
- 在订单完成时记录成本快照
- 使用 Redis 缓存近期统计结果
- 定时任务预计算统计数据

---

## 🚀 部署步骤

### 1. 代码部署
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖（如有新增）
cd ChatBackEnd
npm install

# 3. 编译检查
npm run build

# 4. 重启服务
npm run start:prod
```

### 2. 数据验证
```bash
# 测试统计接口
curl -X GET "http://localhost:3001/api/revenue/stats/today" \
  -H "Authorization: Bearer YOUR_BOSS_TOKEN"

# 验证响应包含 materialCost 字段
# 验证 grossMarginRate 不再固定为30
```

### 3. 菜品绑定检查
```bash
# 查询未绑定食材的菜品
db.dishes.find({ 
  ingredients: { $size: 0 } 
}).count()

# 建议：为这些菜品绑定对应食材
```

---

## 📈 后续优化

### 短期（1-2周）
- [ ] 添加成本趋势分析报表
- [ ] 实现高成本菜品预警
- [ ] 优化大数据量查询性能

### 中期（1-2月）
- [ ] 支持历史成本快照
- [ ] 食材成本占比分析
- [ ] 菜品定价建议功能

### 长期（3-6月）
- [ ] 成本预测和预算管理
- [ ] 智能采购建议
- [ ] 利润率优化推荐

---

## 🆘 回滚方案

如果升级后出现问题，可以回滚到固定毛利率方案：

```typescript
// revenue.service.ts
private readonly GROSS_MARGIN_RATE = 0.3; // 恢复常量

private calculateFinancialMetrics(
  revenue: number,
  extraIncome: number,
  extraExpense: number,
) {
  const materialCost = revenue * (1 - this.GROSS_MARGIN_RATE);
  const grossProfit = revenue * this.GROSS_MARGIN_RATE;
  const totalCost = materialCost + extraExpense;
  const netProfit = grossProfit - extraExpense + extraIncome;

  return {
    revenue: parseFloat(revenue.toFixed(2)),
    cost: parseFloat(totalCost.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossMarginRate: parseFloat((this.GROSS_MARGIN_RATE * 100).toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    extraIncome: parseFloat(extraIncome.toFixed(2)),
    extraExpense: parseFloat(extraExpense.toFixed(2)),
  };
}

// 统计方法调用时移除 actualMaterialCost 参数
```

---

## 📞 技术支持

### 常见问题

**Q: 升级后毛利率降低了正常吗？**
A: 正常。固定30%是估算值，实际毛利率可能更低或更高，取决于菜品的真实成本。

**Q: 为什么某些菜品显示毛利率100%？**
A: 可能是该菜品未绑定食材，导致成本为0。请在菜品管理中绑定对应食材。

**Q: 成本计算会影响性能吗？**
A: 订单数量较少时（<500）影响很小。大量订单时建议使用缓存或成本快照优化。

---

## ✅ 验收标准

- [x] 代码编译无错误
- [x] TypeScript 类型检查通过
- [x] 所有统计接口返回 `materialCost` 字段
- [x] `grossMarginRate` 根据实际成本动态计算
- [x] 测试用例覆盖精确成本核算场景
- [x] 文档更新完整

---

## 📚 相关文档

- [收入管理系统需求文档](./revenue.md)
- [收入管理系统实现文档](./revenue.implementation.md)
- [收入管理系统测试用例](./revenue.testcase.md)
- [菜品绑定食材功能需求](../dish-ingredient-binding/dish-ingredient-binding.md)

---

**升级完成日期**: 2026-02-01  
**负责人**: AI Assistant  
**状态**: ✅ 已完成
