import { lazy } from 'react'
import { AppstoreOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * SCOPE: this module implements only the Call Center Queue CRUD half of Axion's `callCenter`
 * module (list/add/edit/copy/delete + Start/Stop/Restart), matching the task's own requested file
 * structure and the module's own name. The Axion reference also bundles a separate Agent entity
 * sub-module (Agent list/add/edit/delete + Agent Status bulk screen, gated by its own distinct
 * `AGENT_PERMISSION` permission model) and a non-functional Activity placeholder screen
 * (call-center.md §1/§3/§14/§28/§33 — the audit itself documents Activity as hardcoded-empty and
 * recommends either implementing it for real or removing it, i.e. NOT reproducing it as-is). Both
 * are deliberately out of scope here — see the final implementation report for the full rationale.
 * The queue form's own "Agent tiers" section only needs a per-domain Agent *options* dropdown
 * (see call-center.service.ts's getCallCenterAgentOptions), not the full Agent CRUD.
 */
const CallCentersPage = lazy(() => import('./pages/CallCentersPage'))
const AddCallCenterPage = lazy(() => import('./pages/AddCallCenterPage'))
const EditCallCenterPage = lazy(() => import('./pages/EditCallCenterPage'))

const callCenterRoutes: AdminRouterItem[] = [
  {
    path: 'call-center',
    element: (
      <LazyRoute>
        <CallCentersPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Call Centers',
      title: 'Call Centers',
      key: '/call-center',
      icon: <CustomerServiceOutlined />,
      order: 3,
      hideBreadcrumb: true,
      // Reuses Announcements'/Call Block's group.key so all three land under one shared
      // "Applications" sidebar parent without nesting in the actual route tree — matches the
      // audit's own "Applications → Call Centers" category (call-center.md §1).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'call-center/add',
    element: (
      <LazyRoute>
        <AddCallCenterPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Call Center Queue',
      key: '/call-center/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-center/:callCenterId/edit',
    element: (
      <LazyRoute>
        <EditCallCenterPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Call Center Queue',
      key: '/call-center/:callCenterId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default callCenterRoutes
