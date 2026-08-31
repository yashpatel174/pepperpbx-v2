# PepperPBX Frontend V2

PepperPBX Frontend V2 is the web-based administration and control-plane interface for the PepperPBX platform. It provides the interface administrators use to manage a PBX deployment: multi-domain administration, authentication and role-based access control, dashboards and analytics, configuration and CRUD workflows for PBX resources, real-time PBX information, and a responsive, themeable administration UI.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.7 | UI framework |
| TypeScript | 6.0.3 | Type safety (strict mode) |
| Vite | 8.1.0 | Build tool / dev server |
| Ant Design | 6.5.0 | UI component library (+ `@ant-design/icons` 6.3.2) |
| React Router | 7.18.0 | Routing (`react-router-dom`) |
| Zustand | 5.0.14 | Client/application state management |
| Axios | 1.18.1 | HTTP client |
| Socket.IO Client | 4.8.3 | Real-time (WebSocket) connectivity |
| lodash-es | 4.18.1 | Utility helpers |

---

## Architecture

```text
Browser
  ↓
React Application
  ↓
Routing / Guards
  ↓
Authentication
  ↓
Domain Context
  ↓
RBAC / Permissions
  ↓
PBX Modules
  ↓
REST API / WebSocket
```

Key principles:

- **Modular** — each PBX capability is developed as an independent feature module.
- **Centralized API layer** — all HTTP traffic goes through a single, shared client.
- **Centralized authentication** — one auth store and interceptor chain, not per-page logic.
- **Domain-aware** — the application is built around a current-domain concept rather than a single-tenant assumption.
- **RBAC-aware UI** — screens and actions can be gated by permission, with the backend as the final authority.
- **Shared UI foundation** — common loading/empty/error/not-found states and Ant Design as the single UI system.
- **Token-based theming** — visual styling is driven by Ant Design theme tokens, not hardcoded colors.
- **Real-time ready** — a shared WebSocket connection manager underpins live PBX features.

---

## Project Structure

```text
src/
├── app/            # Application composition root (providers, top-level layout switch)
├── layouts/         # Page shells (authenticated admin layout, bare auth-page layout)
├── router/           # Route registration and route guards
├── services/
│   ├── api/            # Centralized HTTP client and interceptors
│   ├── auth/            # Authentication service
│   └── websocket/        # Real-time connection manager
├── store/             # Zustand state stores
├── hooks/              # Shared React hooks
├── components/
│   ├── common/           # Cross-module UI (route guards, permission guards, etc.)
│   └── feedback/          # Shared loading/empty/error/not-found/permission-denied states
├── config/             # Theme configuration and presets
├── assets/             # Application assets
└── modules/            # Feature modules (see Module Architecture)
```

---

## Module Architecture

PBX capabilities are organized as independent feature modules under `src/modules/`. Each module owns its pages, components, hooks, service layer, and types, and registers its own routes — there is no central route table to edit.

```text
src/modules/<feature>/
├── <feature>.router.tsx
├── index.tsx
├── <feature>.types.ts
├── <feature>.service.ts
└── components/
```

New modules should follow this same ownership pattern. A component, hook, or utility only moves into a shared location (`src/components/`, `src/hooks/`, `src/services/`) once it is genuinely used by more than one module.

---

## Authentication

- Access-token/refresh-token based session state, managed centrally in a dedicated auth store.
- Axios interceptors attach the access token to outgoing requests and transparently refresh it on expiry, retrying the original request.
- Protected routes require an authenticated session; unauthenticated users are redirected to login.
- A mock authentication mode is available for local development, controlled by an environment variable (see [Environment Variables](#environment-variables)).

Production backend integration for authentication is ongoing.

---

## Multi-Domain

The frontend is built around a current-domain concept: a centralized domain store and a `useCurrentDomain()` hook expose the active domain to any part of the application without prop-drilling. Backend integration for listing and switching domains is still in progress.

---

## RBAC

The UI supports permission-aware rendering via a centralized permissions store and a `PermissionGuard` component for conditionally showing or hiding actions and screens. The backend remains the authoritative security boundary at all times — frontend permission checks are a UX convenience, never a substitute for backend authorization. Backend integration for the permission model is still in progress.

---

## Theme System

- Light, dark, and compact display modes, switchable at runtime.
- Multiple built-in color presets plus full custom color, spacing, border-radius, and typography overrides.
- Theme preferences persist across sessions.
- Styling is driven entirely by Ant Design theme tokens.

New components should use theme tokens instead of hardcoded theme-dependent colors, so they render correctly across every mode and preset.

---

## API / WebSocket

- **`src/services/api/`** — the centralized REST API client and its request/response interceptors (authentication, error handling).
- **`src/services/auth/`** — the authentication service used for login, token refresh, and logout.
- **`src/services/websocket/`** — a shared real-time connection manager, providing a single connect/subscribe/unsubscribe/disconnect surface for real-time PBX features.

---

## State Management

Application/client state (authentication, theme, current domain, permissions, and similar UI-level concerns) is managed with Zustand stores under `src/store/`. Server data fetching currently uses standard request/response handling in each module; a dedicated server-state library will be introduced if and when a module's data requirements justify it.

---

## Development Setup

### Prerequisites

```text
Node.js ^20.19.0 or >=22.12.0
npm
```

### Install

```bash
npm ci
```

### Run

```bash
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=
VITE_USE_MOCK=true
```

- `VITE_API_BASE_URL` — backend API base URL.
- `VITE_WS_URL` — WebSocket server URL.
- `VITE_USE_MOCK` — set to `false` to use the real backend instead of local mock authentication.

`.env.example` is committed; `.env` should not be. Frontend environment variables are bundled into the browser build and are public — never place a secret in one.

---

## Coding Standards

**Naming**

| Kind | Convention | Example |
|---|---|---|
| Component | PascalCase | `ExtensionForm.tsx` |
| Variable / function | camelCase | `loadExtensions()` |
| Hook | `useSomething.ts` | `useExtensions.ts` |
| Service | `something.service.ts` | `extension.service.ts` |
| Types | `something.types.ts` | `extension.types.ts` |
| Constants | `something.constants.ts` | `extension.constants.ts` |
| Route module | `something.router.tsx` | `extensions.router.tsx` |

**Components** — prefer Ant Design for standard UI; reuse existing components before creating new ones; keep module-specific components inside their module; only genuinely shared components belong in `src/components/`.

**Theme** — never hardcode a theme-dependent color; use Ant Design theme tokens.

**API** — don't scatter raw HTTP calls through page components; use the service layer.

**RBAC** — use permission-aware UI guards where appropriate; never rely on frontend checks as the security boundary.

**Dependencies** — check whether an existing library already solves the problem before adding a new one; avoid introducing a second UI framework; commit `package.json` and `package-lock.json` together whenever dependencies change.

**Before submitting changes**, run:

```bash
npm run lint
npm run build
```

---

## Development Workflow

```text
Create feature branch
        ↓
Implement change
        ↓
Run lint
        ↓
Run build
        ↓
Review
        ↓
Commit
        ↓
Push / Pull Request
```

Feature work should follow the existing module architecture described above.

---

## Current Product Scope

The current repository contains the frontend foundation and shared application infrastructure — routing, layout, theming, authentication, domain and RBAC scaffolding, the API/WebSocket layer, and shared UI states. PBX modules are implemented incrementally on top of this foundation.
