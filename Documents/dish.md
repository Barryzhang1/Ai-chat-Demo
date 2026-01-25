# 菜品模块需求文档

## 1. 功能描述
- 提供菜品的新增与查询所有接口。
- 支持菜品的基本信息管理。

## 2. 数据库字段
- 名称（name）：string，必填，菜品名称
- 价格（price）：number，必填，菜品价格
- 描述（description）：string，选填，菜品描述
- 是否下架（isDelisted）：boolean，默认为 false

## 3. API接口
### 3.1 新增菜品
- 路径：POST /dish
- 请求体：
  - name: string
  - price: number
  - description: string（可选）
- 返回：创建后的菜品信息

### 3.2 查询所有菜品
- 路径：GET /dish
- 返回：菜品列表（数组，每项包含name、price、description）

## 4. 业务规则
- 名称和价格为必填项，描述可选。
- 新增时需校验名称和价格不能为空。

## 5. 其他
- 后续可扩展：编辑、删除、分页、分类等功能。
