
ChatBackend AI开发流程

ChatBackend/Documents 存放各功能详细需求
ChatBackend/Documents/auth.md auth模块功能
ChatBackend/Documents/auth/register.md 注册功能需求
ChatBackend/Documents/auth/login.md 登陆功能需求

开发流程
1. 获取用户意图，找到对应的需求文档，阅读它
2. 按照本项目规范实现这个功能，写完后重新review，并进行优化代码
3. 写出实现代码后的测试用例，覆盖各种case，并执行测试。出错则进行修复，再进行测试，直至测试全部通过
4. 在实现代码的对应模块里放入实现的文档说明