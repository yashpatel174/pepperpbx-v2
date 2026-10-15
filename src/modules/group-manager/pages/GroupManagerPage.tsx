import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { App, Button, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined, UserOutlined } from '@ant-design/icons'
import { usersPath } from '../../users/users.constants'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import ModuleHeader from '../../../components/common/ModuleHeader'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import GroupManagerFilters from '../components/GroupManagerFilters'
import GroupManagerTable from '../components/GroupManagerTable'
import { groupEditPath, groupManagerPath, groupMembersPath, groupPermissionsPath } from '../group-manager.constants'
import useGroups from '../useGroups'
import type { Group } from '../group-manager.types'

const GroupManagerPage = () => {
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
    removeGroup,
  } = useGroups()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await removeGroup(deleteTarget.group_uuid)
    message.success(`Group "${deleteTarget.group_name}" deleted successfully.`)
    setDeleteTarget(null)
  }

  if (error) return <ErrorState message={error} onRetry={refresh} />
  if (loading && data.length === 0 && !searchTerm) return <LoadingState rows={10} />

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Group Manager"
        count={totalRecords}
        // TODO(permissions): gate Add / Users behind PermissionGuard once the backend permission contract exists.
        primaryAction={{ key: 'add', label: 'Add', icon: <PlusOutlined />, onClick: () => navigate(`${groupManagerPath}/add`) }}
        actions={[{ key: 'users', label: 'Users', icon: <UserOutlined />, onClick: () => navigate(usersPath) }]}
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <GroupManagerFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            <Tooltip title="Show groups from all domains">
              <Space size="small">
                <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all groups" />
                <span>Show All</span>
              </Space>
            </Tooltip>
          </>
        }
      />

      {totalRecords === 0 && !loading ? (
        <EmptyState description={searchTerm ? 'No groups match your search.' : 'No groups found.'} />
      ) : (
        <GroupManagerTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          // TODO(permissions): gate Edit / Delete / Permissions / Members behind PermissionGuard once the backend permission contract exists.
          onEdit={(group: Group) => navigate(groupEditPath(group.group_uuid))}
          onDelete={setDeleteTarget}
          onOpenPermissions={(group: Group) => navigate(groupPermissionsPath(group.group_uuid))}
          onOpenMembers={(group: Group) => navigate(groupMembersPath(group.group_uuid))}
        />
      )}

      <ConfirmActionModal
        open={!!deleteTarget}
        title="Delete Group"
        confirmText="Delete"
        danger
        errorMessage="Failed to delete the group."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      >
        <Typography.Paragraph>
          Are you sure you want to delete the group &quot;{deleteTarget?.group_name}&quot;? Its permission assignments are removed with it.
        </Typography.Paragraph>
      </ConfirmActionModal>
    </Space>
  )
}

export default GroupManagerPage
