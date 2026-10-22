import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Space } from 'antd'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import ModuleHeader from '../../../components/common/ModuleHeader'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import { isNotFoundError } from '../../../services/api/apiError'
import { getGroupPermissions } from '../../group-manager/group-manager.service'
import type { GroupPermissionsData } from '../../group-manager/group-manager.types'
import UserGroupPermissionsTable from '../components/UserGroupPermissionsTable'
import { usersPath } from '../users.constants'

/**
 * View-only list of the permissions assigned to one group, opened from the Users table. It reads the
 * same data as Group Manager's permissions page (getGroupPermissions) but keeps only the assigned
 * permissions and renders them without any way to change them.
 * BACKEND CONTRACT REQUIRED: no group-permission endpoint is confirmed.
 */
const UserGroupPermissionsPage = () => {
  const navigate = useNavigate()
  const { groupId } = useParams<{ groupId: string }>()

  const [data, setData] = useState<GroupPermissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      setData(await getGroupPermissions(groupId))
    } catch (err) {
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load group permissions.')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  // Assigned permissions only; the search narrows this set and can never bring in unassigned ones.
  const assigned = useMemo(() => {
    const names = new Set((data?.assignments ?? []).map((a) => a.permission_name))
    return (data?.catalog ?? []).filter((p) => names.has(p.permission_name))
  }, [data])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return assigned.filter((p) => !needle || p.permission_name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle))
  }, [assigned, search])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading && !data) return <LoadingState rows={8} />
  if (notFound || !data || !groupId) {
    return <EmptyState description="Group not found." action={<Button onClick={() => navigate(usersPath)}>Back to Users</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title={`Group Permissions (${data.group.group_name})`}
        count={assigned.length}
        toolbar={
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <FormPageToolbar onBack={() => navigate(usersPath)} />
            {assigned.length > 0 && (
              <Input.Search
                allowClear
                placeholder="Search permissions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                style={{ width: '100%', maxWidth: 240 }}
                aria-label="Search permissions"
              />
            )}
          </Space>
        }
      />

      {assigned.length === 0 ? (
        <EmptyState description="No permissions assigned to this group." />
      ) : visible.length === 0 ? (
        <EmptyState description="No permissions match your search." />
      ) : (
        <UserGroupPermissionsTable permissions={visible} loading={loading} />
      )}
    </Space>
  )
}

export default UserGroupPermissionsPage
