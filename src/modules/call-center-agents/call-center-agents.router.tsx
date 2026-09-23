import { lazy } from 'react'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * SCOPE: Call Center Agent entity CRUD + the separate Agent Status bulk-edit screen — the
 * sibling half of the Call Center feature the Queue module (src/modules/call-center/) explicitly
 * left out of scope. A flat top-level module (not nested inside call-center/) matching this
 * project's existing precedent of related-but-separate feature modules living as siblings rather
 * than nested directories (e.g. Destinations/Outbound Routes under dialplans/).
 *
 * No sidebar entry for any route here (call-center.md §1: "The Agent sub-screens have no separate
 * nav entry — reached via an Agents button on the Call Center list toolbar") — every route is
 * `hideInMenu`. See src/modules/call-center/pages/CallCentersPage.tsx for that entry point.
 */
const CallCenterAgentsPage = lazy(() => import('./pages/CallCenterAgentsPage'))
const AddCallCenterAgentPage = lazy(() => import('./pages/AddCallCenterAgentPage'))
const EditCallCenterAgentPage = lazy(() => import('./pages/EditCallCenterAgentPage'))
const CallCenterAgentStatusPage = lazy(() => import('./pages/CallCenterAgentStatusPage'))

const callCenterAgentsRoutes: AdminRouterItem[] = [
  {
    path: 'call-center/agents',
    element: (
      <LazyRoute>
        <CallCenterAgentsPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Call Center Agents',
      key: '/call-center/agents',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-center/agents/add',
    element: (
      <LazyRoute>
        <AddCallCenterAgentPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Call Center Agent',
      key: '/call-center/agents/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-center/agents/status',
    element: (
      <LazyRoute>
        <CallCenterAgentStatusPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Call Center Agent Status',
      key: '/call-center/agents/status',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-center/agents/:agentId/edit',
    element: (
      <LazyRoute>
        <EditCallCenterAgentPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Call Center Agent',
      key: '/call-center/agents/:agentId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default callCenterAgentsRoutes
