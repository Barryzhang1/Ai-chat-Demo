# 弹出框国际化修复测试用例

## 修复背景（2026-02-06）

修复了订单列表等页面中弹出框确认取消按钮没有国际化的问题。影响范围包括：
- 商家订单管理 (OrderList.js)
- 进货单管理 (PurchaseOrderList.js) 
- 类别管理 (CategoryManagement.js)
- 收入管理 (RevenueManagement)
- 首页对话管理 (Home.js)

## 测试用例1：订单状态修改确认弹窗国际化

**测试页面**：商家后台 → 订单列表
**前置条件**：
- 使用STAFF或BOSS账号登录
- 订单列表中有状态为"pending"或"preparing"的订单

**操作步骤**：
1. 进入订单列表页面
2. 点击订单项的"接单"或"完成"按钮
3. 观察确认弹窗的按钮文本
4. 切换语言到英文
5. 重复步骤2-3

**预期结果**：
- 中文环境：确认按钮显示"确认"，取消按钮显示"取消"
- 英文环境：确认按钮显示"Confirm"，取消按钮显示"Cancel"

---

## 测试用例2：进货单审批确认弹窗国际化

**测试页面**：商家后台 → 库存管理 → 进货单列表 
**前置条件**：
- 使用BOSS账号登录
- 进货单列表中有状态为"pending"的进货单

**操作步骤**：
1. 进入进货单列表页面
2. 点击进货单的"批准"按钮
3. 观察确认弹窗的按钮文本
4. 切换语言到英文
5. 重复步骤2-3
6. 点击任意进货单查看详情
7. 观察详情弹窗的"确认"按钮

**预期结果**：
- 批准确认弹窗：中文环境显示"确认"/"取消"，英文环境显示"Confirm"/"Cancel"
- 详情弹窗：中文环境显示"确认"，英文环境显示"Confirm"

---

## 测试用例3：类别删除确认弹窗国际化

**测试页面**：商家后台 → 类别管理
**前置条件**：
- 使用STAFF或BOSS账号登录
- 类别列表中有可删除的类别

**操作步骤**：
1. 进入类别管理页面
2. 点击某个类别的删除按钮
3. 观察确认弹窗的按钮文本
4. 切换语言到英文  
5. 重复步骤2-3

**预期结果**：
- 中文环境：确认按钮显示"确认"，取消按钮显示"取消"
- 英文环境：确认按钮显示"Confirm"，取消按钮显示"Cancel"

---

## 测试用例4：收入管理确认弹窗国际化

**测试页面**：商家后台 → 收入管理
**前置条件**：
- 使用相应权限账号登录
- 收入管理页面有可操作的数据

**操作步骤**：
1. 进入收入管理相关页面（批量创建、收支记录列表）
2. 执行删除或提交操作触发确认弹窗
3. 观察弹窗按钮文本
4. 切换语言验证国际化

**预期结果**：
- 所有确认弹窗按钮都正确显示对应语言文本
- 支持动态参数（如记录数量、收入/支出类型）的正确国际化

---

## 测试用例5：首页对话删除确认弹窗国际化

**测试页面**：首页
**前置条件**：
- 首页有历史对话记录

**操作步骤**：
1. 进入首页
2. 点击对话项的删除按钮
3. 观察确认弹窗按钮文本
4. 切换语言验证

**预期结果**：
- 中文环境：确认按钮显示"删除"，取消按钮显示"取消"
- 英文环境：确认按钮显示"Delete"，取消按钮显示"Cancel"

---

## 回归测试清单

修复完成后需要验证：
- [ ] 所有弹窗在中英文环境下都有正确的按钮文本
- [ ] 按钮功能正常（确认/取消行为符合预期）
- [ ] 弹窗内容文本的国际化正常（之前已有的content部分）
- [ ] 无控制台报错或警告
- [ ] 页面其他功能未受影响

---

## 新增国际化键值

本次修复新增以下i18n键值：

**中文版本：**
```javascript
// Revenue Management
income: '收入',
expense: '支出', 
confirmSubmitTransactions: '确定要提交 {count} 条记录吗？',
confirmDeleteTransaction: '确定要删除这条{type}记录吗？',

// Home page
confirmDeleteConversation: '确定要删除这个对话吗？',
```

**英文版本：**
```javascript
// Revenue Management
income: 'Income',
expense: 'Expense',
confirmSubmitTransactions: 'Confirm to submit {count} records?',
confirmDeleteTransaction: 'Confirm to delete this {type} record?',

// Home page
confirmDeleteConversation: 'Confirm to delete this conversation?',
```

---

## 技术实现要点

1. **Dialog.confirm 标准格式**：
   ```javascript
   const result = await Dialog.confirm({
     content: t('confirmMessage', language),
     confirmText: t('confirm', language),
     cancelText: t('cancel', language),
   });
   ```

2. **Dialog.alert 标准格式**：
   ```javascript
   Dialog.alert({
     title: t('title', language),
     content: t('content', language),
     confirmText: t('confirm', language),
   });
   ```

3. **避免硬编码**：所有按钮文本都通过 t() 函数进行国际化处理，不直接使用中文或英文字符串。