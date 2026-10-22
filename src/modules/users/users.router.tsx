import { lazy } from 'react'
import { SettingOutlined, UserOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const UsersPage = lazy(() => import('./pages/UsersPage'))
const AddUserPage = lazy(() => import('./pages/AddUserPage'))
const EditUserPage = lazy(() => import('./pages/EditUserPage'))
const UserGroupPermissionsPage = lazy(() => import('./pages/UserGroupPermissionsPage'))
const AddUserSettingPage = lazy(() => import('./pages/AddUserSettingPage'))
const EditUserSettingPage = lazy(() => import('./pages/EditUserSettingPage'))

const hiddenMeta = (title: string, key: string) => ({ title, key, hideInMenu: true, hideBreadcrumb: true })

const usersRoutes: AdminRouterItem[] = [
  {
    path: 'advanced/users',
    element: (
      <LazyRoute>
        <UsersPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Users',
      title: 'Users',
      key: '/advanced/users',
      icon: <UserOutlined />,
      order: 2,
      hideBreadcrumb: true,
      group: { key: 'advanced', label: 'Advanced', icon: <SettingOutlined />, order: 6 },
    },
  },
  {
    path: 'advanced/users/add',
    element: (
      <LazyRoute>
        <AddUserPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Add User', '/advanced/users/add'),
  },
  {
    path: 'advanced/users/:userId/edit',
    element: (
      <LazyRoute>
        <EditUserPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Edit User', '/advanced/users/:userId/edit'),
  },
  {
    path: 'advanced/users/groups/:groupId/permissions',
    element: (
      <LazyRoute>
        <UserGroupPermissionsPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Group Permissions', '/advanced/users/groups/:groupId/permissions'),
  },
  {
    path: 'advanced/users/:userId/settings/add',
    element: (
      <LazyRoute>
        <AddUserSettingPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Add User Setting', '/advanced/users/:userId/settings/add'),
  },
  {
    path: 'advanced/users/:userId/settings/:settingId/edit',
    element: (
      <LazyRoute>
        <EditUserSettingPage />
      </LazyRoute>
    ),
    meta: hiddenMeta('Edit User Setting', '/advanced/users/:userId/settings/:settingId/edit'),
  },
]

export default usersRoutes
