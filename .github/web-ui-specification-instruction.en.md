# ChatUI Mobile Web UI Design Specification (iOS Simplicity + System Blue)

> Scope: This repository's ChatUI (Mobile Web / H5 / PWA).
>
> Goal: Unify visual and interaction baselines, reduce style drift between pages; converge primary accent color to iOS System Blue; only retain the "user message bubble" gradient as a unique touch.

---

## 1. Style Definition (iOS Simplicity)

### 1.1 Core Principles
- **Restrained Colors**: Use white/light gray for large areas, with accent colors only for "interactive/selected/key-hint" elements.
- **Light Shadows/Dividers**: Prioritize 0.5px dividers or very light shadows, avoiding heavy projections.
- **Consistent Corner Radius System**: Use consistent corner radii for the same component types to reduce inconsistencies between pages.
- **Subtle Animations**: Only use necessary `opacity/transform` animations, and support `prefers-reduced-motion` by default.

### 1.2 Confirmed Project Decisions
- **Primary/Accent Color**: Use iOS System Blue `#007AFF`
- **Gradient Strategy**:
  - ✅ **Only retained for the user message bubble** (UserOrder user bubble)
  - ❌ Do not use gradients for the Register page background/buttons (to avoid conflicting with the iOS simplicity style)

---

## 2. Design Tokens (Recommended)

> Note: Tokens should first be defined as global CSS variables (currently in `:root` in `src/App.css`, or can be moved to `src/styles/tokens.css` later). Page CSS should only reference variables, avoiding hard-coded values.

### 2.1 Color
- Primary (System Blue)
  - `--adm-color-primary: #007AFF;`
  - `--color-primary-pressed: #0066D6;`
  - `--color-primary-tint: rgba(0, 122, 255, 0.12);`
  - `--focus-ring: rgba(0, 122, 255, 0.35);`

- Neutral Colors (Recommended)
  - `--color-bg: #f5f5f5;`
  - `--color-surface: #ffffff;`
  - `--color-surface-muted: #f7f7f8;`
  - `--color-text: #111111;`
  - `--color-text-secondary: #565869;`
  - `--color-divider: rgba(0, 0, 0, 0.06);`

- Semantic Colors (Do not get modified by the "unify primary color" effort)
  - `--adm-color-success` / `--adm-color-danger` / `--adm-color-warning` should be kept for their semantic purposes.

### 2.2 Corner Radius (Radius)
- `--radius-card: 12px;`
- `--radius-bubble: 12px;`
- `--radius-pill: 999px;`

### 2.3 Shadow
- `--shadow-1: 0 1px 2px rgba(0, 0, 0, 0.08);`
- `--shadow-2: 0 2px 8px rgba(0, 0, 0, 0.10);`

### 2.4 Typography
- Title: 20–24px
- Body: 15px
- Auxiliary: 13px
- Line Height: Body 1.5–1.6

### 2.5 Motion
- `--t-fast: 120ms;`
- `--t-med: 200ms;`
- `--t-slow: 300ms;`
- reduced motion:
  - `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms; animation-iteration-count: 1; transition-duration: 0.001ms; } }`

---

## 3. Mobile Web Layout Hard Rules (Must be followed)

### 3.1 Safe Area (Notch/Home Bar)
- Bottom fixed areas (like the chat input box) must use:
  - `padding-bottom: calc(env(safe-area-inset-bottom) + Xpx)`

### 3.2 Soft Keyboard and 100vh Issue
- Pages with input fields should avoid relying solely on `height: 100vh`.
- It is recommended to use `min-height: 100dvh` (and keep `100vh` as a fallback).

### 3.3 Scrolling Container Partitioning (Strict constraint for UserOrder)
- Three-section layout:
  1) Top navigation (fixed, non-scrollable)
  2) Message area (the only scrollable region)
  3) Bottom input area (fixed, non-scrollable)

---

## 4. Component Specifications (Executable Standards)

### 4.1 Button
- Primary button: Use `--adm-color-primary` (System Blue), with a recommended height of 44px.
- Touch target: Minimum 44×44px.
- States: default / active / disabled + visible focus.

### 4.2 Input
- Background: `--color-surface-muted`
- Corner radius: Recommended 16–18px (or pill shape)
- Prevent container width change on input: The container should have a fixed `width/min/max`, and the input inside should use `width: 100%`.

### 4.3 Card
- White background + `--shadow-2` or a 0.5px divider (prefer the more iOS-like option).
- Padding: 16px

### 4.4 Tabs/Header
- Height: 44–56px
- Selected state: Use System Blue + a thin indicator bar (not a large background block).

### 4.5 Message Bubble
- **Only user message bubbles retain the gradient**:
  - `linear-gradient(135deg, #a4e9c6 0%, #b3a0ff 100%)`
- Other bubbles/accent colors: Unify using the System Blue token (or a neutral style).

---

## 5. Accessibility (WCAG 2.2 AA)

### 5.1 Touch Target
- Target: 44×44px (try to meet this for all icon buttons).

### 5.2 Contrast Ratio
- Body text contrast ratio ≥ 4.5:1; large text ≥ 3:1.
- White text on System Blue usually meets the criteria, but active/pressed colors still need verification.

### 5.3 Focus/Keyboard Accessibility
- Do not remove the outline; instead, use `:focus-visible` to show a focus ring.

### 5.4 Reduced Motion
- The background animation on the Register page must be disabled under `prefers-reduced-motion`.

---

## 6. Color Unification Implementation Steps (The "above steps" you confirmed)

> Goal: Consolidate the scattered `#10a37f / #1677ff / #69c0ff / rgba(22,119,255,0.2)` into the System Blue system.

### Step 1: Update Global Primary Color Token
- Edit: `ChatUI/src/App.css`
- Modify: `--adm-color-primary: #10a37f` → `#007AFF`
- At the same time, you can add: pressed / tint / focus-ring variables.

### Step 2: Clean Up Green Hard-coding on the Home Page
- Edit: `ChatUI/src/pages/Home/Home.css`
- Modify:
  - `.new-chat-btn`'s `background-color: #10a37f;` → `var(--adm-color-primary)` (or remove the override)
  - `.title-icon`'s `color: #10a37f;` → `var(--adm-color-primary)`

### Step 3: Unify Non-UserOrder Blue Accents to System Blue
- Edit:
  - `ChatUI/src/pages/Chat/Chat.css`
  - `ChatUI/src/pages/RoleSelect/RoleSelect.css`
  - `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`
  - `ChatUI/src/components/MessageBubble/MessageBubble.css`
- Modify:
  - `#1677ff` → `var(--adm-color-primary)`
  - `rgba(22, 119, 255, 0.2)` → `rgba(0, 122, 255, 0.2)` or use `--color-primary-tint`

### Step 4: Consolidate Chart Gradient Blue (Do not introduce a second set of blue)
- Edit: `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`
- Modify:
  - `linear-gradient(90deg, #1677ff 0%, #69c0ff 100%)`
  - → `linear-gradient(90deg, var(--adm-color-primary) 0%, rgba(0,122,255,0.35) 100%)`

### Step 5: Keep "User Message Bubble" Gradient as the Only Exception
- Edit: `ChatUI/src/pages/UserOrder/UserOrder.css`
- Keep: The gradient for `.message.user .message-bubble` should not be changed.

---

## 7. Acceptance Checklist (Must pass after changes)

- [ ] The entire site's primary/selected state/main buttons are unified to System Blue (antd-mobile primary is consistent with custom styles).
- [ ] No "second primary color" appears in the project (except for the UserOrder user bubble gradient).
- [ ] Register page: Background animation is disabled under reduced-motion and does not steal visual focus.
- [ ] UserOrder: The message area scrolling does not overlap with the bottom input area, and safe-area works correctly.
- [ ] Touch targets basically meet 44×44px; keyboard focus is visible.

---

## 8. Current Hard-coded Color Distribution (For reference, to facilitate search)

- `#10a37f`
  - `ChatUI/src/App.css` (`--adm-color-primary`)
  - `ChatUI/src/pages/Home/Home.css` (`.new-chat-btn`, `.title-icon`)

- `#1677ff`
  - `ChatUI/src/pages/Chat/Chat.css` (user bubble)
  - `ChatUI/src/pages/RoleSelect/RoleSelect.css` (card border/icon)
  - `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css` (highlight/chart)
  - `ChatUI/src/components/MessageBubble/MessageBubble.css` (user message bubble)

- `#69c0ff`
  - `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css` (chart gradient)

- `rgba(22, 119, 255, 0.2)`
  - `ChatUI/src/pages/RoleSelect/RoleSelect.css` (hover shadow)

- Gradient `#a4e9c6 → #b3a0ff`
  - ✅ `ChatUI/src/pages/UserOrder/UserOrder.css` (user message bubble, the only one to keep)
  - ❌ `ChatUI/src/pages/Register/Register.css` (background/button gradients need to be removed)
