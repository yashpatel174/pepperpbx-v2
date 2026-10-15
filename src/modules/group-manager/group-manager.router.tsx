import { lazy } from 'react'
import { SettingOutlined, TeamOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const GroupManagerPage = lazy(() => import('./pages/GroupManagerPage'))
const AddGroupPage = lazy(() => import('./pages/AddGroupPage'))
const EditGroupPage = lazy(() => import('./pages/EditGroupPage'))
const GroupPermissionsPage = lazy(() => import('./pages/GroupPermissionsPage'))
const GroupMembersPage = lazy(() => import('./pages/GroupMembersPage'))

const hiddenMeta = (title: string, key: string) => ({ title, key, hideInMenu: true, hideBreadcrumb: true })

const groupManagerRoutes: AdminRouterItem[] = [
  {
    path: 'group-manager',
    element: (
      <LazyRoute>
        <GroupManagerPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Group Manager',
      title: 'Group Manager',
      key: '/group-manager',
      icon: <TeamOutlined />,
      order: 1,
      hideBreadcrumb: true,
      group: { key: 'advanced', label: 'Advanced', icon: <SettingOutlined />, order: 6 },
    },
  },
  {
    path: 'group-manager/add',
    element: (
      <LazyRoute>
        <AddGroupPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Add Group', '/group-manager/add'),
  },
  {
    path: 'group-manager/:groupId/edit',
    element: (
      <LazyRoute>
        <EditGroupPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Edit Group', '/group-manager/:groupId/edit'),
  },
  {
    path: 'group-manager/:groupId/permissions',
    element: (
      <LazyRoute>
        <GroupPermissionsPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Group Permissions', '/group-manager/:groupId/permissions'),
  },
  {
    path: 'group-manager/:groupId/members',
    element: (
      <LazyRoute>
        <GroupMembersPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Group Members', '/group-manager/:groupId/members'),
  },
]

export default groupManagerRoutes
