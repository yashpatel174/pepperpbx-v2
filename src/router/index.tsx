import type { ReactNode } from "react";
import {
  RouteObject,
  createBrowserRouter,
} from "react-router-dom";
import App from "../app/App";
import { MenuItemType } from "antd/es/menu/interface";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "../components/feedback/NotFound";


export type AdminRouterItem = RouteObject & {
  // Set antd menu props in meta
  meta?: MenuItemType & {
    hideInMenu?: boolean
    order?: number
    /**
     * Groups this route under a shared parent menu entry (e.g. "Account") without nesting
     * it in the actual route tree — the route's own `path` stays flat/top-level, so routing
     * and breadcrumbs are unaffected. Multiple modules can reuse the same `group.key` to
     * land children under the same parent; see Sidebar.tsx's getMenuItems.
     */
    group?: {
      key: string
      label: string
      icon?: ReactNode
      order?: number
    }
    /** Suppresses MainLayout's global breadcrumb for this route. Defaults to shown. */
    hideBreadcrumb?: boolean
  }
  children?: AdminRouterItem[]
}

/**
 * Auto load route from modules/***\/*.router.ts
 * @returns route
 */
const loadRouteModules = async () => {
  const routeModuleFiles = import.meta.glob('../modules/**/*.router.tsx', {
    eager: true,
    import: 'default'
  })
  const routeModules: AdminRouterItem[] = []

  for await (const [, module] of Object.entries(routeModuleFiles)) {
    if (module) {
      const routes = Array.isArray(module) ? module : [module];
      routeModules.push(...routes);
    }
  }


  return routeModules
}

const routeModules = await loadRouteModules()

// Separate auth routes and protected routes
const authRoutes: AdminRouterItem[] = []
const protectedRoutes: AdminRouterItem[] = []

const wrapWithProtectedRoute = (route: AdminRouterItem): AdminRouterItem => {
  const wrappedChildren = route.children?.map(child => wrapWithProtectedRoute(child)) as AdminRouterItem[] | undefined
  
  return {
    ...route,
    element: route.element ? <ProtectedRoute>{route.element}</ProtectedRoute> : route.element,
    children: wrappedChildren,
  } as AdminRouterItem
}

routeModules.forEach(route => {
  // Auth routes (login, register) don't require authentication
  if (route.path?.startsWith('auth/')) {
    authRoutes.push(route)
  } else {
    // Wrap protected routes with ProtectedRoute
    protectedRoutes.push(wrapWithProtectedRoute(route))
  }
})

export const routes: AdminRouterItem[] = [
  ...authRoutes,
  ...protectedRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
]

const routerConfig: RouteObject[] = [{
  path: "/",
  element: <App />,
  children: routes,
}]

const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(routerConfig)
export default router
