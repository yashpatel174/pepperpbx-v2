# PepperPBX Frontend V2

PepperPBX Frontend V2 is the web-based administration and control-plane interface for the PepperPBX platform. It is the application administrators use to configure and operate a PBX deployment: multi-domain (multi-tenant) administration, authentication and role-based access control, configuration/CRUD workflows for PBX resources (extensions, gateways, IVR, ring groups, etc.), real-time PBX information, and a responsive, themeable admin UI.

This is the application itself, not a starter kit or demo — new PBX modules are built directly on top of the architecture described below.

---

## Tech Stack

Exact versions as pinned in `package.json`:

| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.7 | UI framework |
| React DOM | ^19.2.7 | DOM renderer |
| TypeScript | ^6.0.3 | Type safety (strict mode, no `any`) |
| Vite | ^8.1.0 | Build tool / dev server (`@vitejs/plugin-react-swc` ^4.3.1) |
| Ant Design | ^6.5.0 | UI component library |
| @ant-design/icons | ^6.3.2 | Icon set |
| React Router | ^7.18.0 | Routing (`react-router-dom`) |
| Zustand | ^5.0.14 | Client/application state management |
| Axios | ^1.18.1 | HTTP client |
| Socket.IO Client | ^4.8.3 | Real-time (WebSocket) connectivity |
| lodash-es | ^4.18.1 | Utility helpers |

Dev tooling: ESLint ^10.6.0 with `@typescript-eslint` ^8.62.0, `eslint-plugin-react-hooks` ^7.1.1, `eslint-plugin-react-refresh` ^0.5.3.

Node engines: `^20.19.0 || >=22.12.0` (see `package.json` → `engines`).

These choices are deliberate and stable — see [Dependency Policy](#dependency-policy) before adding, upgrading, or replacing anything.

---

## Architecture

```text
Browser
  ↓
React Application  (main.tsx → RouterProvider)
  ↓
Routing / Guards    (file-based route registration, ProtectedRoute)
  ↓
Authentication      (auth store, token refresh)
  ↓
Domain Context       (current-domain foundation)
  ↓
RBAC / Permissions   (permission store, PermissionGuard)
  ↓
PBX Modules          (Extensions, and future modules)
  ↓
REST API / WebSocket (apiClient, socketManager)
```

Key principles:

- **Modular** — each PBX capability is an independent feature module under `src/modules/`, owning its own pages, components, types, service, and routes. There is no central route table.
- **Centralized API layer** — all real HTTP traffic goes through one shared Axios client (`services/api/apiClient.ts`); modules never open their own HTTP client.
- **Centralized authentication** — one auth store and one interceptor chain, not per-page login/refresh logic.
- **Domain-aware by design** — the app is built around a current-domain concept rather than a single-tenant assumption, even before the backend domain contract is finalized.
- **RBAC-aware UI, backend-authoritative** — screens and actions can be gated by permission string; the backend is always the final authorization boundary, never the frontend.
- **Shared UI foundation** — common loading/empty/error/not-found/permission-denied states and Ant Design as the single UI system across every module.
- **Token-based theming** — visual styling is driven entirely by Ant Design theme tokens; modules never hardcode a theme-dependent color.
- **Real-time ready** — a shared WebSocket connection manager underpins live PBX features (not connected to any module yet).
- **Full-page CRUD, not modals** — a module's Create and Edit screens are dedicated routes sharing one form component, not a modal dialog — see [Add/Edit Page Conventions](#addedit-page-conventions).

---

## Project Structure

```text
src/
├── app/App.tsx        # Composition root: ConfigProvider theming, auth-page vs admin-layout switch, `/` redirect
├── layouts/
│   ├── MainLayout/      # Authenticated admin shell: Header, Sidebar, Breadcrumb, Content, ThemeConfigDialog
│   └── AuthLayout/       # Bare Outlet wrapper for /auth/* pages
├── router/
│   ├── index.tsx          # Auto-imports every modules/**/*.router.tsx, wraps non-auth routes in ProtectedRoute
│   └── ProtectedRoute.tsx
├── services/
│   ├── api/                 # Centralized Axios client + interceptors (auth header, 401 refresh-and-retry)
│   ├── auth/                 # Login/refresh/logout — own Axios instance, mock mode, real backend contract TBD
│   └── websocket/             # Shared Socket.IO connection manager (connect/subscribe/unsubscribe/disconnect)
├── store/                # Zustand stores: auth, theme, domain, permissions
├── hooks/                 # useResponsive, useCurrentDomain, useCurrentUser, usePermissions
├── components/
│   ├── common/              # Cross-module UI: LazyRoute, PermissionGuard, ModuleHeader
│   └── feedback/              # LoadingState, EmptyState, ErrorState, NotFound, PermissionDenied, SessionExpired
├── config/                # Theme token config + color presets
├── assets/                # Bundled/imported static assets (see Asset Conventions)
└── modules/               # Feature modules — see Module Architecture
```

`public/` holds files served as-is at the site root (currently just the favicon) — see [Asset Conventions](#assetpublic-folder-conventions).

---

## Module Architecture

Every PBX capability is an independent feature module under `src/modules/<feature>/`. A module registers its own routes via a `*.router.tsx` file that the router auto-discovers (`import.meta.glob('../modules/**/*.router.tsx')`) — **adding a module never requires editing a shared route table.**

A module with just a list page stays flat:

```text
modules/<feature>/
├── <feature>.router.tsx
├── <feature>.types.ts
├── <feature>.service.ts
├── <feature>.constants.ts
├── use<Feature>.ts
├── index.tsx                # the list page
└── components/
```

A module with Add/Edit screens (the common case) adds a `pages/` folder once there is more than one page-level route — this is the shape established by `modules/extensions/`, the reference module:

```text
modules/extensions/
├── extensions.router.tsx      # list, /add, /:extensionId/edit
├── extension.types.ts         # Extension entity + ExtensionFormValues
├── extension.service.ts       # mock CRUD boundary today — swap for apiClient later, same call sites
├── extension.constants.ts     # form defaults, dropdown option lists
├── extension.mock.ts          # seed data for the service's in-memory working copy
├── useExtensions.ts            # list page's data + client-side search
├── pages/
│   ├── ExtensionsPage.tsx      # list
│   ├── AddExtensionPage.tsx    # mode="create"
│   └── EditExtensionPage.tsx   # mode="edit", loads the record by id first
└── components/
    ├── ExtensionFilters.tsx
    ├── ExtensionTable.tsx
    └── ExtensionForm.tsx       # shared by Add AND Edit — never duplicated per mode
```

A component, hook, or utility only moves into a shared location (`src/components/`, `src/hooks/`, `src/services/`) once it is genuinely used by more than one module — don't promote something to "shared" on day one just in case.

### How to Create a New PBX Module

Using Extensions as the template (replace "Extension"/"extension" with your feature, e.g. "Gateway"/"gateway"):

1. **Types** (`<feature>.types.ts`) — define the entity (`Gateway`) and, if the form collects fields the entity doesn't carry as-is (write-only secrets, UI-only toggles), a separate `<Feature>FormValues` type. Don't reuse one type for both if their shapes genuinely differ.
2. **Constants** (`<feature>.constants.ts`) — default form values (one source of truth, reused by both the Add page and the form's initial state) and any finite dropdown option lists.
3. **Mock + service** (`<feature>.mock.ts`, `<feature>.service.ts`) — seed data plus `getXs()`, `getXById()`, `createX()`, `updateX()`, and any uniqueness/validation helpers a form needs. The service owns its own mutable working copy of the mock data; nothing outside the service touches the mock file directly. This is the one place that later gets rewired to call `apiClient` instead of the mock array — no other file needs to change when that happens.
4. **List hook** (`use<Feature>s.ts`) — owns the list page's data loading and client-side search/filter state.
5. **List page + table + filters** (`pages/<Feature>sPage.tsx`, `components/<Feature>Table.tsx`, `components/<Feature>Filters.tsx`) — see [Table/Listing Conventions](#tablelisting-conventions).
6. **Shared form** (`components/<Feature>Form.tsx`) — one component, a `mode: 'create' | 'edit'` prop, used by both Add and Edit. See [Add/Edit Page Conventions](#addedit-page-conventions).
7. **Add/Edit pages** (`pages/Add<Feature>Page.tsx`, `pages/Edit<Feature>Page.tsx`) — thin: routing, data loading (Edit only), the mock/service submit call, success message, navigate back. All real field logic lives in the shared form, not the pages.
8. **Router** (`<feature>.router.tsx`) — three routes (list, `/add`, `/:id/edit`), each with `meta` (list gets `group`/menu entry; Add/Edit get `hideInMenu: true` and `hideBreadcrumb: true` to match the list page). Nothing else needs to change — the router glob picks the file up automatically.

That's the whole checklist. No shared route table, no central form registry, no module registration step anywhere else in the codebase.

---

## Routing Architecture

- **File-based, zero central table.** `router/index.tsx` globs every `modules/**/*.router.tsx`, each default-exporting an array of `AdminRouterItem` (a React Router `RouteObject` plus a `meta` block).
- **`meta` shape:** `label`/`title`/`key`/`icon`/`order` (sidebar menu), `hideInMenu` (route exists but isn't a menu entry — used by every Add/Edit route), `hideBreadcrumb` (suppresses the global breadcrumb for that route), `group` (buckets several routes under one shared sidebar parent, e.g. "Account", without nesting them in the actual route tree). `meta` fields never leak onto rendered DOM nodes — the sidebar explicitly whitelists only the fields Ant Design's `Menu` understands before handing items to it.
- **Auth vs. protected, by path prefix.** Any route whose `path` starts with `auth/` is public (login/register). Every other route is automatically wrapped in `ProtectedRoute`, which redirects to `/auth/login` when `useAuthStore().isAuthenticated` is false — there is no per-route opt-in/opt-out; this is structural.
- **Dynamic segments** work normally (`account/extensions/:extensionId/edit`), read via React Router's `useParams()`.
- **Unmatched routes** render the shared `NotFound` (404) page via a catch-all `*` route.
- **Adding a page never touches this file** — see [How to Create a New PBX Module](#how-to-create-a-new-pbx-module).

---

## Authentication

- Access-token/refresh-token session state lives in a dedicated, persisted Zustand store (`store/auth.ts`).
- `services/auth/auth.service.ts` handles login/refresh/logout on its **own** Axios instance, deliberately bypassing the shared `apiClient` — routing refresh's own HTTP call back through `apiClient`'s 401-refresh interceptor would create a cycle.
- The shared `apiClient`'s interceptors attach the bearer token to every outgoing request and, on a 401, coalesce concurrent requests into a single refresh call, retry the original request once, and fall back to logout + redirect to `/auth/login?sessionExpired=1` if refresh fails.
- A mock authentication mode (`VITE_USE_MOCK`, on by default) lets local development run with no backend at all.
- **The exact backend response shape for `/auth/login` and `/auth/refresh` is not yet confirmed** — the current field mapping is a placeholder; verify against the real contract before treating it as final.

---

## Domain / Multi-Tenancy Foundation

`store/domain.ts` holds `currentDomain` and `availableDomains` (persisted), with `useCurrentDomain()` as the read hook so any module can read the active domain without prop-drilling.

**This is a foundation only** — nothing currently populates it (no login-response mapping, no "list my domains" call), and no module or API call reads it yet. A module that talks to a real backend endpoint must thread the current domain into that call once the backend's domain-scoping contract exists; don't assume a shape (query param vs. header vs. path segment) ahead of that confirmation. There's no UI domain switcher yet either.

---

## RBAC Foundation

- `store/permissions.ts` holds a flat `permissions: string[]`, starting **empty** — nothing populates it yet, and it deliberately does not default to "all granted" as a shortcut.
- `usePermissions()` exposes `{ permissions, hasPermission }`.
- `<PermissionGuard permission="...">` conditionally renders (or shows a fallback for) its children based on `hasPermission()`. Example, once permissions are real:
  ```tsx
  <PermissionGuard permission="extension.create">
    <Button onClick={handleAdd}>Add Extension</Button>
  </PermissionGuard>
  ```
- **Today, permission checks are TODO comments, not live guards** — wrapping a control in `PermissionGuard` right now would hide it for every user, since the store is always empty. Modules mark the intended permission string with a comment (see `extensions/pages/AddExtensionPage.tsx`) and leave the control unguarded until the backend contract lands.
- **The backend is always the final authorization boundary.** Frontend permission checks are a UX convenience only — hiding/disabling controls, never a security measure. Never treat a hidden button as "secured."
- Don't invent permission-string naming or a domains/permissions endpoint contract — confirm with the backend before wiring this for real.

---

## API Architecture

- **`services/api/apiClient.ts`** — the one shared Axios instance every module should use for real backend calls, plus a typed `request.{get,post,put,patch,delete}` wrapper. Its response interceptor unwraps `response.data`, so callers get `T` directly.
- **`services/api/interceptors.ts`** — auth header injection, coalesced 401 refresh-and-retry, and error normalization to `{ status, message, data }`.
- **`services/auth/`** — login/refresh/logout, on its own Axios instance (see Authentication above).
- Modules never call `axios`/`fetch` directly from a component — HTTP (real or, today, mock) goes through the module's own `<feature>.service.ts`, which is the single file that later gets rewired from mock data to `apiClient`.

---

## State Management

Application/client state (auth, theme, current domain, permissions) is managed with Zustand stores under `src/store/` — small, direct, no boilerplate. Server data (extensions, and future PBX resources) is currently fetched with plain request/response state in each module's hook (see `useExtensions.ts`). A dedicated server-state/caching library (e.g. TanStack Query) is intentionally deferred until a module's data needs (large paginated tables, real caching/invalidation requirements) actually justify it — don't add one speculatively.

---

## WebSocket Foundation

`services/websocket/socketManager.ts` is a singleton wrapping `socket.io-client` with `connect()/disconnect()/subscribe()/unsubscribe()/getSocket()`, reading `VITE_WS_URL` and attaching the current access token. **Not connected anywhere yet** — this is connection-lifecycle scaffolding so future live modules (Active Calls, Queues, etc.) share one connection instead of each opening their own. Don't add a second WebSocket client.

---

## Theme System

- **Light and dark** display modes, switchable at runtime from the header.
- **Compact density is fixed and permanent** — it is not a user toggle; it's always part of the active algorithm.
- **Color presets + full custom colors** — several built-in presets, or per-token custom color overrides, both available from the header's theme dialog.
- **Typography, spacing, and border radius are fixed and intentionally not user-configurable** — there is no UI control for any of them, and no store state, type, or migration logic for them either. If you're looking for a "customize spacing" hook, it doesn't exist by design.
- Theme preference (algorithm + colors) persists across sessions via a persisted Zustand store.
- Styling is driven entirely by Ant Design theme tokens (`theme.useToken()` / `ConfigProvider`) — **never hardcode a hex color that represents theme intent.** Structural surfaces (header/sidebar/table backgrounds, borders) are set once via `ConfigProvider`'s `components` token overrides in `app/App.tsx`, independent of the user's accent-color choice, so switching presets never breaks the layout's visual hierarchy.
- A new component must render correctly across light, dark, and every preset/custom color — check with the header's theme dialog.

---

## Responsive UI Standards

- `hooks/useResponsive.ts` exposes `{ isMobile, isTablet }` (mobile ≤ 768px, tablet 769–1024px) for JS-level layout branching (e.g. collapsing the sidebar, switching a header's controls to a compact set).
- Form and table layouts use Ant Design's own `Row`/`Col` breakpoints (`xs`/`md`/etc.) for CSS-driven responsive grouping — prefer this over `useResponsive` branching when the change is purely visual (e.g. a form field going from half-width to full-width).
- Verify new screens at common desktop widths (1440/1280/1024) and mobile widths (~430/390/375) with the sidebar in both expanded and collapsed states.

---

## Extensions Reference Module

`src/modules/extensions/` is the first real PBX module and the reference implementation for both the list/table pattern and the Add/Edit pattern — every future module (Gateways, IVR, Ring Groups, Conferences, Call Centers, Dialplans, Outbound Routes, Time Conditions, Music On Hold, …) should start by cloning its shape, not inventing a new one.

**Copy this:**
- The file layout and naming (see [Module Architecture](#module-architecture)).
- The service boundary — mock data behind `<feature>.service.ts` functions with real-looking async signatures (`Promise<T>`), so swapping mock internals for `apiClient` calls later touches one file and changes zero call sites.
- The shared `<Feature>Form` component with a `mode` prop, used by both Add and Edit, owning fields/layout/validation; pages own only routing, data loading, and the submit call.
- `ModuleHeader` for every page's title/count/primary-action/secondary-actions/filters row — don't hand-roll a page header.
- `components/feedback/{LoadingState,EmptyState,ErrorState}` for every loading/empty/error state, including a record-scoped "not found" (bad id in an Edit URL) via `EmptyState` with a back action — not the app-level 404 page, which is for unmatched routes.
- Ant Design `Form` validation co-located with each field (including async validators, e.g. Extensions' duplicate-number check against the mock service) — no schema-validation library.
- TODO-only permission markers on the actions that will eventually need `PermissionGuard`, left unguarded until the backend contract is real.

**Do NOT copy blindly:**
- **Field set.** Extensions' specific fields (SIP secret, voicemail, directory listing, call group, context, …) are Extensions' domain model, not a generic template — a Gateway or IVR module has its own real fields; don't cargo-cult Extensions' fields into an unrelated module.
- **Mock data shape.** Each module's mock/seed data should reflect its own entity, not Extensions'.
- **Validation specifics.** Extensions' rules (digits-only extension numbers, 8-char SIP secret minimum, etc.) are Extensions-specific; derive each module's validation from its own known constraints, and leave a clear placeholder rather than inventing a backend rule that isn't confirmed.
- **Any permission string.** `extension.create`/`extension.edit` are Extensions' own placeholder identifiers — don't reuse them for another module; use `<module>.<action>` and leave a TODO like Extensions does.

---

## Add/Edit Page Conventions

- **Routes:** `/<module>` (list), `/<module>/add`, `/<module>/:id/edit` — three flat sibling routes, no shared parent-route nesting.
- **One shared form component**, never `Add<Feature>Form`/`Edit<Feature>Form` duplicates. It takes `mode: 'create' | 'edit'`, `initialValues` (always fully loaded by the time the form mounts — the page handles the loading state, not the form), an `onSubmit`/`onCancel` pair, and a `submitting` flag.
- **Pages own:** routing (`useNavigate`/`useParams`), data loading for Edit (fetch-by-id through the module's service, never a mock array directly), the create/update service call, the success message (via `App.useApp()`, never a static `import { message } from 'antd'`), and navigating back to the list on success.
- **Forms own:** fields, section layout, validation rules, conditional fields, and the Cancel/Save buttons.
- **Edit's "not found"** (bad id in the URL) renders `EmptyState` with a back action — never a broken/blank form, never silently creates a new record.
- **No real API calls during mock-only phases** — a module's Add/Edit can be fully built, validated, and demoed against its `<feature>.service.ts` mock layer before the backend contract exists; the service boundary is what makes the later swap a non-event for the form and pages.

---

## Table/Listing Conventions

- `ModuleHeader` (title + record count, primary action, secondary actions, filter/search controls) at the top of every list page.
- Ant Design `Table` with `rowKey`, `loading`, `rowSelection`, `pagination` (respecting a "Show All" toggle where the module has one), and horizontal `scroll.x` for narrow-viewport usability — never a fixed/min vertical height forcing empty space; table height follows the actual row count.
- Search/filtering is client-side against the loaded dataset for now (see `useExtensions.ts`); a module expecting a large dataset should plan for server-side pagination/search when it adopts a real backend, not before.
- Row actions (edit/duplicate/delete, etc.) navigate to the Add/Edit routes or call the module's service directly; destructive actions go through `Popconfirm`.

---

## Form/Validation Conventions

- Ant Design `Form`, `layout="vertical"`, sections grouped with `Card` + `Divider` + `Typography.Title` (one `Card` for the whole form, not one per section), fields in `Row`/`Col` for 2-column-desktop → 1-column-mobile layout.
- Validation via `Form.Item` `rules` — required/pattern/type/min/max/custom `validator` (including async validators for things like uniqueness checks against the current dataset). No schema-validation library is installed; this is a deliberate choice, not an oversight.
- Conditional fields render/hide via `Form.useWatch` on the field they depend on — not manual DOM/window hacks.
- Don't invent a strict backend constraint (an arbitrary length limit, a made-up format) that isn't confirmed — implement a reasonable UI-level rule and leave the tightening as a clearly marked follow-up.

---

## Loading / Empty / Error State Conventions

Use `components/feedback/`, don't reimplement ad hoc:

| Component | Use for |
|---|---|
| `LoadingState` | A page/section still fetching its data |
| `EmptyState` | A genuinely empty result (no records, no search matches, a record-scoped "not found") |
| `ErrorState` | A failed fetch, with an optional retry action |
| `NotFound` | The router's catch-all for an unmatched URL |
| `PermissionDenied` | Reserved for a real 403 once RBAC is live — not wired to any route yet |
| `SessionExpired` | Shown on the login page after a forced logout |

---

## Asset/Public-Folder Conventions

- **`src/assets/`** — assets imported into components (bundled, hashed, optimized by Vite). Use this for anything referenced from code.
- **`public/`** — files served as-is at the site root, unprocessed (currently just the favicon). Use this only for files that must be reachable by a fixed, un-hashed URL.

---

## Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=
VITE_USE_MOCK=true
```

- `VITE_API_BASE_URL` — backend API base URL, used by both `apiClient` and the auth service.
- `VITE_WS_URL` — WebSocket server URL; leave blank until a live module needs it.
- `VITE_USE_MOCK` — set to `false` to use the real backend instead of local mock authentication. Defaults to mock **on** when unset, so a fresh clone runs with zero setup.

`.env.example` is committed; `.env` is not. All `VITE_`-prefixed variables are bundled into the client and are public — never put a real secret behind one.

---

## Installation / Setup

```bash
npm install       # or npm ci
```

Requires Node `^20.19.0` or `>=22.12.0`.

## Development Commands

```bash
npm run dev        # start the dev server (vite --host) at http://localhost:5173
npm run preview    # preview a production build
```

## Build / Lint / Typecheck

```bash
npm run build      # tsc -b (type-check, project references) && vite build
npm run lint       # eslint . --max-warnings 0 — zero warnings allowed
```

There is no separate `typecheck` script — `npm run build` performs the full TypeScript project-reference check (`tsc -b`) before bundling, so a clean build already proves the type-check passes.

---

## Dependency Policy

- Before adding any package: can Ant Design (or Ant Design Charts) already do it? Can existing code do it? Is it maintained and compatible with React 19 / Ant Design 6 / Vite 8 / TypeScript 6? Does it introduce a second design system? Does it meaningfully grow the bundle?
- Never run a blanket `npm update`. Never bump a major version "while you're in there" — upgrades are deliberate, isolated changes.
- Ant Design is the only UI framework here — no MUI, Chakra, Bootstrap, shadcn/ui, or a Tailwind component kit.
- Always commit `package.json` and `package-lock.json` together when dependencies change.

---

## Coding Standards

**Naming**

| Kind | Convention | Example |
|---|---|---|
| Component | PascalCase | `ExtensionForm.tsx` |
| Variable / function | camelCase | `loadExtensions()` |
| Types / interfaces | PascalCase | `Extension`, `ExtensionFormValues` |
| Hook | `useSomething.ts` | `useExtensions.ts` |
| Service | `something.service.ts` | `extension.service.ts` |
| Types file | `something.types.ts` | `extension.types.ts` |
| Constants file | `something.constants.ts` | `extension.constants.ts` |
| Route module | `something.router.tsx` | `extensions.router.tsx` |
| Constants | camelCase for ordinary values (`defaultPageSize`); `ALL_CAPS` reserved for genuine global constants | |

**General**

- No `any` — the codebase is currently `any`-free; keep it that way. If UI form values differ in shape from the entity type, define a separate type rather than overloading one type for both.
- Prefer Ant Design components for standard UI (forms, tables, drawers, modals, selects, tabs, cards, alerts, uploads); build PBX-specific UI from Ant Design primitives rather than raw HTML/CSS.
- Reuse existing components before creating new ones; keep module-specific components inside their module — only promote to `src/components/` once genuinely shared.
- Theme tokens only, never a hardcoded theme-dependent color (see [Theme System](#theme-system)).
- All real HTTP traffic through a module's `<feature>.service.ts` → the shared `apiClient` — never raw `axios`/`fetch` in a component.
- Don't build abstractions (`BaseForm`, `AbstractModule`, a generic table/CRUD factory) ahead of real repetition across 3+ modules — abstraction follows repetition, not the other way around.
- Don't pre-create empty folders "for structure" — add a folder when you have something to put in it.
- **Before submitting changes, always run:**
  ```bash
  npm run lint
  npm run build
  ```

---

## Important Architecture Rules

1. **The backend is always the final authorization authority.** Frontend RBAC (`PermissionGuard`, `hasPermission()`) and domain scoping are UX conveniences — never treat a hidden button, a disabled field, or a client-side route redirect as a security boundary.
2. **Don't invent a backend contract.** Auth response shapes, permission-string names, and the domain-scoping model are explicitly unconfirmed in several places in this codebase (see Authentication, RBAC, and Domain sections above) — implement a clearly marked placeholder, don't guess a "final" shape.
3. **One shared form per module**, used by both Add and Edit via a `mode` prop — never two near-duplicate form components.
4. **One shared API client** (`services/api/apiClient.ts`) and **one WebSocket connection manager** (`services/websocket/socketManager.ts`) for the whole app — modules never open their own.
5. **A module's mock data lives behind its service layer**, never imported directly by a page or component — this is what makes the eventual real-backend swap touch one file instead of the whole module.
6. **No second UI framework, no schema-validation library, no server-state library** unless a real, current need justifies introducing one (see [Dependency Policy](#dependency-policy) and [State Management](#state-management)) — these have been deliberately evaluated and deferred, not overlooked.

## Rules Junior Developers Must Follow

- Clone the **Extensions module's structure** for any new PBX module (see [Extensions Reference Module](#extensions-reference-module)) — don't design a new file layout per module.
- Never hardcode a color; always use theme tokens. Check your screen in light, dark, and with a couple of color presets before calling it done.
- Never call `axios`/`fetch` directly from a component — go through your module's service.
- Never wrap a control in `PermissionGuard` with a permission string you invented — leave a TODO comment instead until the backend contract exists, matching Extensions' pattern.
- Never assume a single-tenant world — read the current domain through `useCurrentDomain()` wherever a real API call needs it, once the backend's domain contract lands; don't hardcode or skip it "for now" in a way that's easy to forget later.
- Every list page needs `ModuleHeader` + `LoadingState`/`EmptyState`/`ErrorState` — don't hand-roll these per module.
- Every Add/Edit page needs a route-based `EmptyState` "not found" for a bad id — never a blank or crashing form.
- Run `npm run lint` and `npm run build` before considering any change done.
- If you're about to introduce a new dependency, a new abstraction, or a pattern that diverges from Extensions, stop and check [Dependency Policy](#dependency-policy) / [Important Architecture Rules](#important-architecture-rules) first — most of the time the answer is "reuse what's already there."
