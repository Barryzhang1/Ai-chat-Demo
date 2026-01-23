# 认证模块测试说明

## 测试文件位置

### 单元测试
- `src/modules/auth/auth.controller.spec.ts` - Controller 单元测试
- `src/modules/auth/auth.service.spec.ts` - Service 单元测试

### E2E测试
- `test/auth.e2e-spec.ts` - 端到端集成测试

## 运行测试

### 运行所有认证模块测试

```bash
# 方式1：使用自定义脚本
chmod +x test-auth.sh
./test-auth.sh

# 方式2：使用npm命令
npm test -- --testPathPattern=auth

# 方式3：运行E2E测试
npm run test:e2e -- --testPathPattern=auth
```

### 运行单个测试文件

```bash
# 运行 Controller 测试
npm test -- auth.controller.spec.ts

# 运行 Service 测试
npm test -- auth.service.spec.ts

# 运行 E2E 测试
npm run test:e2e -- auth.e2e-spec.ts
```

### 查看测试覆盖率

```bash
npm run test:cov -- --testPathPattern=auth
```

## 测试用例覆盖

### Controller 测试 (auth.controller.spec.ts)

✅ **正常场景**
- 成功注册中文昵称用户
- 成功注册英文昵称用户
- 成功注册混合昵称用户
- 成功注册带下划线的昵称
- 返回有效的UUID格式的用户ID
- 返回ISO 8601格式的创建时间

### Service 测试 (auth.service.spec.ts)

✅ **正常场景**
- 成功注册中文昵称用户
- 成功注册英文昵称用户
- 成功注册混合昵称用户
- 成功注册带下划线的昵称
- 为每个用户生成唯一的UUID
- 为每个用户生成不同的token
- 生成的用户ID是有效的UUID v4格式
- 创建时间是有效的ISO 8601格式

✅ **异常场景**
- 昵称已存在时抛出ConflictException
- ConflictException包含正确的错误消息

✅ **查询功能**
- 通过ID查找已注册的用户
- 查找不存在的ID返回undefined
- 通过昵称查找已注册的用户
- 查找不存在的昵称返回undefined

### E2E 测试 (auth.e2e-spec.ts)

✅ **正常场景**
- 成功注册中文昵称用户并返回201
- 成功注册英文昵称用户
- 成功注册混合昵称用户
- 成功注册带下划线的昵称

✅ **异常场景 - DTO验证**
- 昵称为空应该返回400
- 昵称过短（1个字符）应该返回400
- 昵称过长（21个字符）应该返回400
- 昵称包含特殊字符（@）应该返回400
- 昵称包含空格应该返回400
- 缺少nickname字段应该返回400
- nickname不是字符串类型应该返回400

✅ **异常场景 - 业务逻辑**
- 昵称已存在应该返回409

## 预期测试结果

所有测试应该通过：
- ✅ Controller 测试：6个测试用例
- ✅ Service 测试：14个测试用例
- ✅ E2E 测试：12个测试用例

**总计：32个测试用例**

## 注意事项

1. **ValidationPipe配置**：E2E测试需要在app中配置全局ValidationPipe才能正确测试DTO验证
2. **内存存储**：当前使用内存存储用户数据，每次测试运行会重置状态
3. **Token生成**：当前使用简化版token，后续需要替换为真实的JWT实现
4. **数据库**：后续需要将内存存储替换为真实的数据库（如PostgreSQL + TypeORM）

## 后续改进

- [ ] 集成真实的JWT token生成
- [ ] 连接真实数据库
- [ ] 添加性能测试（响应时间 < 500ms）
- [ ] 添加并发测试（100 QPS）
- [ ] 添加安全性测试（XSS、SQL注入防护）
