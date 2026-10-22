import { lazy } from 'react'
import { AppstoreOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Time Conditions (time-conditions.md): list, Add, Edit (read-only for view-only users), Delete
 * (row + bulk) and the row Status toggle. No Import/Export, bulk Toggle/Copy or realtime view — the
 * audit confirms none exist. Routes follow PepperPBX's `/<module>`, `/<module>/add`,
 * `/<module>/:id/edit` convention rather than Axion's `/timeConditions/edit?time_condition_uuid=`.
 */
const TimeConditionsPage = lazy(() => import('./pages/TimeConditionsPage'))
const AddTimeConditionPage = lazy(() => import('./pages/AddTimeConditionPage'))
const EditTimeConditionPage = lazy(() => import('./pages/EditTimeConditionPage'))

const timeConditionsRoutes: AdminRouterItem[] = [
  {
    path: 'time-conditions',
    element: (
      <LazyRoute>
        <TimeConditionsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Time Conditions',
      title: 'Time Conditions',
      key: '/time-conditions',
      icon: <ClockCircleOutlined />,
      order: 12,
      hideBreadcrumb: true,
      // Applications → Time Conditions (§1).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'time-conditions/add',
    element: (
      <LazyRoute>
        <AddTimeConditionPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Time Condition',
      key: '/time-conditions/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'time-conditions/:timeConditionId/edit',
    element: (
      <LazyRoute>
        <EditTimeConditionPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Time Condition',
      key: '/time-conditions/:timeConditionId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default timeConditionsRoutes
