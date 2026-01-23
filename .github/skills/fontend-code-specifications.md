---
name: fontend-code-specifications
description: Coding standards for the ChatUI frontend project. Follow this when generating, modifying, or refactoring ChatUI code.
---

# React Frontend Code Standards

## 1. References

- Airbnb JavaScript Style Guide: a widely adopted style guide covering syntax, naming, formatting, modules, and React/JSX conventions. https://github.com/airbnb/javascript
- eslint-plugin-react (`plugin:react/recommended`): lint rules for JSX such as `jsx-no-duplicate-props`, `jsx-key`, `no-direct-mutation-state`. https://github.com/jsx-eslint/eslint-plugin-react
- eslint-plugin-react-hooks: official Hooks lint rules (top-level-only hooks, exhaustive deps). https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
- Rules of Hooks: rationale and examples. https://react.dev/reference/rules/rules-of-hooks

## 2. JavaScript Baselines

- Prefer `const`/`let`. Avoid `var` and implicit globals.
- Use arrow functions by default. Single-expression functions may omit braces and `return`.
- Prefer destructuring, spread, and default parameters. Avoid `arguments`, chained assignments, and `++/--` to reduce side effects.
- Use semicolons and consistent 2-space indentation. Keep spacing consistent (e.g., `if (condition)`, `function name()`).
- Naming: camelCase for variables/functions, PascalCase for components/classes, UPPER_SNAKE_CASE for exported constants.

## 3. React/JSX Conventions

- Component file name must match the default exported component name; keep one default export per component file.
- For multi-line JSX props, place one prop per line and keep a consistent ordering. List items must have a stable `key` (avoid array indexes).
- Avoid passing inline handlers unnecessarily; use `useCallback` or define handlers in the parent scope when appropriate.
- Do not mutate state directly; always update via `setState` and create new objects/arrays for reference types.
- Wrap returned JSX in a single root element (or a fragment).

## 4. Hooks and Side Effects

- Follow the Rules of Hooks: call Hooks only at the top level of a component or custom Hook, never in conditions/loops/nested functions.
- `useEffect`/`useMemo`/`useCallback` dependency arrays must include all referenced values. If you must suppress it, document the reason.
- Name setters symmetrically (e.g., `[count, setCount]`) to avoid confusion.

## 5. ESLint Recommendations

- `extends`: `['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended']`
- Set `settings.react.version` to `detect`, and enable `parserOptions.ecmaFeatures.jsx`.
- Consider `react/jsx-filename-extension` and adding `eslint-plugin-jsx-a11y` + `eslint-plugin-import`.
- If the project uses TypeScript, add `@typescript-eslint` rules and configs (optionally `eslint-config-airbnb-typescript`).

## 6. Adoption Tips

- Run `npm run lint` before each commit; enforce the same ESLint configuration in CI.
- If you introduce Prettier, use `eslint-config-prettier` (and optionally `eslint-plugin-prettier`) to avoid conflicting rules.
- Link this document from the project `README` / onboarding docs so new teammates can find it quickly.
