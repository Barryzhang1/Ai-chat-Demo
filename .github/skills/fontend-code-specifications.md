---
name: fontend-code-specifications
description: 这个skill用于fontend项目ChatUI生成代码时进行参考，保证在代码生成时有统一规则，在生成C或者优化ChatUI代码时使用
---

# React 前端代码规范

## 1. 参考资源

- Airbnb JavaScript Style Guide：社区公认的系统化规范，涵盖基础语法、命名、缩进、模块、甚至 React/JSX 的组件结构、生命周期约定等，适合作为团队默认风格。链接：https://github.com/airbnb/javascript
- eslint-plugin-react（`plugin:react/recommended`）：提供针对 JSX 的 lint 规则，如 `jsx-no-duplicate-props`、`jsx-key`、`no-direct-mutation-state`，帮助识别易错模式。链接：https://github.com/jsx-eslint/eslint-plugin-react
- eslint-plugin-react-hooks：React 官方维护的 Hooks 规则插件，强制 “Hooks 只在最顶层调用”“依赖数组必须完整”，是 Hooks 项目的必备。链接：https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
- React Hooks 规则文档：解释为何这些约束存在，便于理解 Hook 的设计哲学。链接：https://beta.reactjs.org/docs/hooks-rules

## 2. JavaScript 基础约定

- 全局统一使用 `const`/`let`，避免 `var` 和隐式全局。
- 箭头函数为默认的匿名函数形式，单表达式函数可以省略大括号与 `return`，复杂逻辑应抽出命名函数以便调试。
- 鼓励使用解构、展开、默认参数，严禁直接使用 `arguments`、链式赋值或 `++/--`，以降低副作用风险。
- 所有语句使用分号结尾；多行结构用 2 空格缩进；保持 `if (condition)`、`function name()` 等空格规范一致。
- 命名风格：变量/函数采用 camelCase，组件/类用 PascalCase，常量（仅导出）可使用 UPPER_SNAKE_CASE，避免前后下划线或不可读缩写。

## 3. React/JSX 专属约定

- 每个组件文件名必须与其默认导出组件名一致，只导出一个默认组件，便于 IDE 跳转和重构。
- JSX 属性多行拆分时，每个属性一行，保持属性顺序一致（比如事件/数据/样式），并在自闭合标签前保留逗号；循环中的元素必须含 `key`，且禁止使用数组索引。
- props 不直接传入函数绑定或内联函数，必要时使用 `useCallback` 或在父作用域定义函数。
- 不要直接修改 `this.state`，只通过 `setState`，对引用型 state 必须创建新对象/数组。
- 返回的 JSX 应包裹在一个根元素（或 fragment），避免多个顶级节点。

## 4. Hooks 与副作用

- 遵守 Hooks 规则：仅在函数组件或自定义 Hook 的最顶层调用 Hooks，不在条件/循环/嵌套函数中调用，保持依赖顺序一致。
- `useEffect`/`useMemo`/`useCallback` 的依赖数组必须列出所有引用的变量，对特殊情况使用 `// eslint-disable-next-line react-hooks/exhaustive-deps` 并补充变更原因。
- `useState` 返回的 setter 命名应与 state 名称对称（如 `[count, setCount]`），避免混淆状态来源。

## 5. ESLint 配置建议

- `extends`: `['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended']`
- `settings.react.version` 设置为 `detect`，配合 `parserOptions.ecmaFeatures.jsx` 打开 JSX 识别。
- 启用 `react/jsx-filename-extension` 限制 `.jsx`/`.tsx` 中使用 JSX，并搭配 `eslint-plugin-jsx-a11y` 与 `eslint-plugin-import` 强化可访问性与导入顺序。
- 若项目使用 TypeScript，可再加入 `@typescript-eslint` 相关扩展，配合 `eslint-config-airbnb-typescript`。

## 6. 推行建议

- 每次提交前运行 `npm run lint`，CI 使用同一 ESLint 配置保证环境一致。
- 可引入 Prettier（通过 `eslint-config-prettier` + `eslint-plugin-prettier`）统一格式，但必须关闭与 ESLint 冲突的规则。
- 将本节内容在 `README` 或团队入职文档中显著提醒，以便新成员快速了解前端规范。# React 前端代码规范

## 1. 参考资源

- Airbnb JavaScript Style Guide：社区公认的系统化规范，涵盖基础语法、命名、缩进、模块、甚至 React/JSX 的结构和组件顺序，适合作为项目默认风格。[https://github.com/airbnb/javascript](https://github.com/airbnb/javascript)
- eslint-plugin-react（`plugin:react/recommended`）：提供 React/JSX 相关的 lint 规则，如 `jsx-no-duplicate-props`、`jsx-key`、`no-direct-mutation-state` 等，帮助避免常见错误。[https://github.com/jsx-eslint/eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- eslint-plugin-react-hooks：React 官方维护，用来强制“Hooks 只在顶部调用”“依赖数组完整”等规则，防止潜在的副作用和漏掉依赖。[https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- React Hooks 规则文档：解释为什么那些约束存在，便于团队理解 Hook 的设计哲学。[https://beta.reactjs.org/docs/hooks-rules](https://beta.reactjs.org/docs/hooks-rules)

## 2. JavaScript 基础约定

- 统一采用 `const`/`let`，避免 `var`，块级作用域清晰。
- 箭头函数为默认形式，单表达式且无副作用时可省略花括号与 `return`；复杂逻辑建议抽成命名函数。
- 鼓励解构、展开、默认参数，避免显式 `arguments`、链式赋值、`++/--`，提高可读性和副作用可控。
- 所有语句以分号结尾；多行表达式用 2 个空格缩进；函数声明与调用不在括号内额外加空格。
- 命名遵循 camelCase（变量/函数）、PascalCase（组件/类）、UPPER_SNAKE_CASE（仅出口的常量），避免前后缀下划线。

## 3. React/JSX 专属约定

- 每个组件文件名必须和默认导出的组件名一致，便于 IDE 跟踪与跳转；一个文件只包含一个默认导出组件。
- JSX 属性多行时，每行一个属性并在闭合/自闭合标签前保留逗号。`key` 属性必须在列表或迭代中出现，禁止使用数组索引作为 `key`。
- 避免在 props 中直接使用函数绑定/内联函数（`bind`/箭头函数），可将处理逻辑提升到父作用域或通过 `useCallback` 缓存。
- 不操作 `this.state`，仅通过 `setState` 更新；state 类型若为引用值请确保不直接修改内部数据。
- 所有组件都应使用 React fragment（`<> </>`）或 `<div>` 包裹 JSX 返回体，避免返回多个顶级元素。

## 4. Hooks 与副作用

- 必须遵守 Hooks 规则：仅在最顶层调用 Hooks，不在条件/循环/嵌套函数内调用，自上而下顺序保持不变。
- `useEffect`/`useMemo`/`useCallback` 的依赖数组必须显式列出所引用的变量；必要时使用 `// eslint-disable-next-line react-hooks/exhaustive-deps` 注释并补充理由。
- `useState` 结构要保持 setter 与 value 命名对称（如 `[value, setValue]`），避免状态值与 setter 混淆。

## 5. ESLint 配置建议

- `extends`: `['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended']`
- `settings.react.version` 设置为 `detect`，自动适配当前依赖的 React 版本。
- 启用 `react/jsx-filename-extension` 限制 `.jsx`/`.tsx` 文件中使用 JSX，以便与 `*.js` 与 `*.ts` 分离。
- 配合 `eslint-plugin-jsx-a11y`、`eslint-plugin-import` 等插件加强可访问性与导入顺序。

## 6. 实施建议

- 每次提交前运行 `npm run lint`（或等效命令），CI 采用相同配置确保一致性。
- 格式化可引入 Prettier，但须与 ESLint 规则统一，可通过 `eslint-config-prettier`/`eslint-plugin-prettier` 联动。
- 将这份规范与项目 `README`、Onboarding 文档链接，确保新成员能快速上手。# React 前端代码规范

## 1. 参考资源

- Airbnb JavaScript Style Guide：社区最受欢迎的规范，覆盖从语言基础、命名、缩进、模块到 React 特有的 JSX/props/组件组织规则。[https://github.com/airbnb/javascript](https://github.com/airbnb/javascript)
- eslint-plugin-react (`plugin:react/recommended`)：提供 JSX 相关的 lint 规则（`jsx-no-duplicate-props`、`jsx-key`、`no-direct-mutation-state` 等），保持组件健壮。[https://github.com/jsx-eslint/eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- eslint-plugin-react-hooks：官方 Hooks lint，强制遵守 “只在顶层调用 Hooks”、“deps 数组完整” 等原则。[https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- React Hooks 规则文档：解释为什么规则存在，便于团队理解 Hook 的设计哲学。[https://beta.reactjs.org/docs/hooks-rules](https://beta.reactjs.org/docs/hooks-rules)

## 2. JavaScript 基础约定

- 全部使用 `const`/`let`，避免 `var`。
- 使用箭头函数作为默认的匿名函数写法，单表达式函数允许省略 `{}` 和 `return`。
- 避免链式赋值、`++/--` 等容易引入副作用的语法。
- 统一 2 个空格缩进、末尾分号、采用 AirBnB 风格命名（camelCase/ PascalCase）和模块导出规则。
- 对象/数组推荐使用字面量、解构、展开操作符，确保最小的写入量。

## 3. React/JSX 约定

- 每个组件文件名与默认导出名称一致，首字母大写。组件之间只能出现一个默认导出。
- JSX 属性按多行时缩进和换行，与 Aqun? (should be consistent) ... (maybe mention consistent attribute order?). Need mention hooking? We'll adapt.
