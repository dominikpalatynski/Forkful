## Layout architecture plan — Option 1 (Separate layouts on a shared BaseLayout)

### Goals

- **Auth** and **Dashboard/App** layouts with a shared foundation.
- Keep Astro as the primary layout mechanism; use React only where interactivity is required.
- Minimize client JavaScript on non‑dashboard pages; mount `LayoutWrapper` only on dashboard.

### Summary of approach

- Introduce `BaseLayout.astro` owning `<html>`, `<head>`, global CSS, and a `<slot />`.
- Create specialized layouts that compose `BaseLayout`:
  - `DashboardLayout.astro`: mounts React `LayoutWrapper` with `client:idle`.
  - `AuthLayout.astro`: centered content, minimal chrome.
- Adopt clear folder conventions for routes: `src/pages/app/*` for dashboard, `src/pages/auth/*` for auth.

### Directory structure

- `src/layouts/BaseLayout.astro`
- `src/layouts/DashboardLayout.astro`
- `src/layouts/AuthLayout.astro`

### New files — scaffolds

Base (shared chrome, global imports, head slot):

```astro
---
// src/layouts/BaseLayout.astro
import "../styles/global.css";
interface Props {
  title?: string;
}
const { title = "Forkful" } = Astro.props as Props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <slot name="head" />
  </head>
  <body class="min-h-screen">
    <slot />
  </body>
</html>
```

Dashboard layout (mounts React shell only here):

```astro
---
// src/layouts/DashboardLayout.astro
import BaseLayout from "./BaseLayout.astro";
import { LayoutWrapper } from "@/components/layout-wrapper";
---

<BaseLayout>
  <LayoutWrapper client:idle>
    <slot />
  </LayoutWrapper>
</BaseLayout>
```

Auth layout (simple centered content):

```astro
---
// src/layouts/AuthLayout.astro
import BaseLayout from "./BaseLayout.astro";
---

<BaseLayout>
  <main class="min-h-screen grid place-items-center p-6">
    <slot />
  </main>
</BaseLayout>
```

### Migration plan

1. Create the three layout files above under `src/layouts`.
2. Route conventions:
   - Pages under `src/pages/app/*` use `DashboardLayout.astro`.
   - Pages under `src/pages/auth/*` use `AuthLayout.astro`.
3. If `src/layouts/Layout.astro` is currently imported across pages, migrate each page to one of the new layouts, then remove or archive `Layout.astro`.

### Client directives guidance

- Use `client:idle` for `LayoutWrapper` to reduce blocking on dashboard pages.
- Use `client:load` only if dashboard UI must be interactive immediately on first paint.
- Keep auth pages purely server-rendered whenever possible (no React mounts).

### Accessibility

- `DashboardLayout`:
  - Use `<aside>` for the sidebar (or `role="complementary"` if needed).
  - Keep `<header>`, `<main>`, and skip links in the shell.
- `AuthLayout`:
  - Single `<main>` with app name as visible heading on the page.

### Performance and SEO

- Avoid importing React components in `AuthLayout`.
- Keep the dashboard shell CSS lean and leverage code-splitting in React if it grows.

### Testing checklist

- Auth pages render centered content; no dashboard shell markup.
- Dashboard pages mount `LayoutWrapper` and the sidebar toggles work.
- Global CSS applies correctly across all layouts.

### Rollout steps

1. Add new layouts (`BaseLayout`, `DashboardLayout`, `AuthLayout`).
2. Migrate a single dashboard page to `DashboardLayout` and verify sidebar.
3. Migrate auth pages to `AuthLayout`.
4. Remove legacy `src/layouts/Layout.astro` after all pages are migrated.

### Risks and mitigations

- Risk: Double `<html>`/`<body>` if pages mistakenly nest `BaseLayout` inside another full-document layout.
  - Mitigation: Standardize on `BaseLayout` owning the document and all other layouts composing it once.
- Risk: Client bundle shipped to non-dashboard pages.
  - Mitigation: Keep React imports out of `AuthLayout` and pages using it.

### Acceptance criteria

- Base layout exists and is composed by specialized layouts.
- No sidebar/header JS on auth pages.
- Dashboard pages behave as before with sidebar/header interactivity.
- `Layout.astro` is no longer referenced.

### Next actions (when implementing)

- Create the three layout files above and migrate pages per plan.
