import { useNavigate } from 'react-router-dom'
import { App, Button, Space, Switch, Tooltip } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import { getApiErrorMessage } from '../../../services/api/apiError'
import UserFilters from '../components/UserFilters'
import UserTable from '../components/UserTable'
import { userEditPath, userGroupPermissionsPath, usersPath } from '../users.constants'
import useUsers from '../useUsers'
import type { User } from '../users.types'

const UsersPage = () => {
  const {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize,
    setShowAll,
    resetFilters,
    refresh,
    pendingIds,
    toggleEnabled,
  } = useUsers()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const handleToggle = async (user: User) => {
    try {
      await toggleEnabled(user)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update user "${user.username}".`))
    }
  }

  if (error) return <ErrorState message={error} onRetry={refresh} />
  if (loading && data.length === 0 && !searchTerm) return <LoadingState rows={10} />

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Users"
        count={totalRecords}
        // TODO(permissions): gate Add behind PermissionGuard once the backend permission contract exists.
        primaryAction={{ key: 'add', label: 'Add', icon: <PlusOutlined />, onClick: () => navigate(`${usersPath}/add`) }}
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <UserFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            <Tooltip title="Show users from all domains">
              <Space size="small">
                <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all users" />
                <span>Show All</span>
              </Space>
            </Tooltip>
          </>
        }
      />

      {totalRecords === 0 && !loading ? (
        <EmptyState description={searchTerm ? 'No users match your search.' : 'No users found.'} />
      ) : (
        <UserTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pendingIds={pendingIds}
          onToggleEnabled={handleToggle}
          // TODO(permissions): gate Edit behind PermissionGuard once the backend permission contract exists.
          onEdit={(user: User) => navigate(userEditPath(user.user_uuid))}
          onOpenGroupPermissions={(groupId: string) => navigate(userGroupPermissionsPath(groupId))}
        />
      )}
    </Space>
  )
}

export default UsersPage
