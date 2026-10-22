import { lazy } from 'react'
import type { AdminRouterItem } from '../../../router'
import LazyRoute from '../../../components/common/LazyRoute'

/**
 * Time Group Presets (Axion `/timegroups/presets/{list,add,edit}`, time-groups.md §1). A child
 * feature of Time Groups: no sidebar entry of its own — reached from the Time Groups list's Presets
 * button, as in Axion. Routes follow PepperPBX's `/<module>`, `/<module>/add`, `/<module>/:id/edit`
 * convention under the Time Groups root.
 */
const TimeGroupPresetsPage = lazy(() => import('./pages/TimeGroupPresetsPage'))
const AddTimeGroupPresetPage = lazy(() => import('./pages/AddTimeGroupPresetPage'))
const EditTimeGroupPresetPage = lazy(() => import('./pages/EditTimeGroupPresetPage'))

const presetsRoutes: AdminRouterItem[] = [
  {
    path: 'time-groups/presets',
    element: (
      <LazyRoute>
        <TimeGroupPresetsPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Presets',
      key: '/time-groups/presets',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'time-groups/presets/add',
    element: (
      <LazyRoute>
        <AddTimeGroupPresetPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Preset',
      key: '/time-groups/presets/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'time-groups/presets/:presetId/edit',
    element: (
      <LazyRoute>
        <EditTimeGroupPresetPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Preset',
      key: '/time-groups/presets/:presetId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default presetsRoutes
