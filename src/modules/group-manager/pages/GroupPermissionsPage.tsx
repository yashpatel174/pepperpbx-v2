import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { App, Button, Col, Input, Row, Select, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import GroupPermissionsTable from '../components/GroupPermissionsTable'
import { getPermissionsReturnTo, groupManagerPath, groupMembersPath, permissionFilterOptions } from '../group-manager.constants'
import type { PermissionFilter } from '../group-manager.constants'
import { getGroupPermissions, saveGroupPermissions } from '../group-manager.service'
import useUnsavedChangesGuard from '../useUnsavedChangesGuard'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import type { GroupPermissionsData, PermissionDefinition } from '../group-manager.types'
import useResponsive from '../../../hooks/useResponsive'

const SEARCH_DEBOUNCE_MS = 400

/** permission name → Protected flag; presence in the map means "assigned". */
type AssignmentMap = Map<string, boolean>

const toMap = (data: GroupPermissionsData): AssignmentMap => new Map(data.assignments.map((a) => [a.permission_name, a.protected]))

const mapsEqual = (a: AssignmentMap, b: AssignmentMap) => a.size === b.size && [...a].every(([name, flag]) => b.get(name) === flag)

const GroupPermissionsPage = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { groupId } = useParams<{ groupId: string }>()
  const location = useLocation()
  const { isMobile, isTablet } = useResponsive()
  // Back goes to the screen that opened this page (Add/Edit Group), else the Group Manager list.
  const backPath = getPermissionsReturnTo(location.state) ?? groupManagerPath

  const [data, setData] = useState<GroupPermissionsData | null>(null)
  const [saved, setSaved] = useState<AssignmentMap>(new Map())
  const [draft, setDraft] = useState<AssignmentMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<PermissionFilter>('all')
  // `searchInput` follows the keystrokes; `search` is the committed term the list filters on.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const lastCommittedSearchRef = useRef('')

  // Same debounce as Announcements' useAnnouncements: commit once typing has paused for SEARCH_DEBOUNCE_MS,
  // skipping a value that was already committed (e.g. by Enter) so no timer re-applies it.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /** Enter / search icon / clear — commits immediately, bypassing the debounce wait. */
  const commitSearch = (value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setSearch(value)
  }

  const dirty = useMemo(() => !mapsEqual(saved, draft), [saved, draft])
  useUnsavedChangesGuard(dirty)

  // Request identity, as in useAnnouncements: a slower earlier response (another group, Reload, or a retry) can't overwrite the latest one.
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!groupId) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const result = await getGroupPermissions(groupId)
      if (requestId !== requestRef.current) return
      setData(result)
      setSaved(toMap(result))
      setDraft(toMap(result))
    } catch (err) {
      if (requestId !== requestRef.current) return
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load group permissions.')
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.catalog ?? []).filter((p) => {
      if (needle && !p.permission_name.toLowerCase().includes(needle) && !p.category.toLowerCase().includes(needle)) return false
      if (filter === 'assigned') return draft.has(p.permission_name)
      if (filter === 'unassigned') return !draft.has(p.permission_name)
      return true
    })
  }, [data, search, filter, draft])

  // Two columns on desktop only. The split happens at a category boundary (nearest to the middle) so a
  // category is never divided across the tables; every visible permission lands in exactly one half.
  const [leftHalf, rightHalf] = useMemo<[PermissionDefinition[], PermissionDefinition[]]>(() => {
    const byCategory = new Map<string, PermissionDefinition[]>()
    visible.forEach((p) => byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p]))
    const groups = [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, items]) => items)

    let splitAt = 0
    let bestGap = Infinity
    let running = 0
    for (let i = 0; i <= groups.length; i++) {
      const gap = Math.abs(visible.length / 2 - running)
      if (gap < bestGap) {
        bestGap = gap
        splitAt = i
      }
      if (i < groups.length) running += groups[i].length
    }
    return [groups.slice(0, splitAt).flat(), groups.slice(splitAt).flat()]
  }, [visible])
  const twoColumns = !isMobile && !isTablet && rightHalf.length > 0 && leftHalf.length > 0

  const handleAssignChange = (names: string[], checked: boolean) => {
    setDraft((current) => {
      const next = new Map(current)
      names.forEach((name) => {
        if (!checked) next.delete(name)
        else if (!next.has(name)) next.set(name, false)
      })
      return next
    })
  }

  const handleProtectedChange = (names: string[], checked: boolean) => {
    setDraft((current) => {
      const next = new Map(current)
      // Protected only applies to assigned permissions; unassigned ones are left alone.
      names.forEach((name) => {
        if (next.has(name)) next.set(name, checked)
      })
      return next
    })
  }

  const handleReload = () => {
    if (!dirty) {
      void load()
      return
    }
    modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'Reloading replaces your unsaved edits with the saved permissions.',
      okText: 'Reload',
      okButtonProps: { danger: true },
      onOk: () => load(),
    })
  }

  const handleSave = async () => {
    if (!groupId) return
    setSaving(true)
    try {
      const assignments = [...draft].map(([permission_name, isProtected]) => ({ permission_name, protected: isProtected }))
      await saveGroupPermissions(groupId, assignments)
      setSaved(new Map(draft))
      message.success(`Permissions saved (${assignments.length} assigned).`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to save permissions.'))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading && !data) return <LoadingState rows={10} />
  if (notFound || !data || !groupId) {
    return <EmptyState description="Group not found." action={<Button onClick={() => navigate(groupManagerPath)}>Back to Group Manager</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title={`Group Permissions (${data.group.group_name})`}
        toolbar={
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <FormPageToolbar onBack={() => navigate(backPath)}>
              <Button icon={<ReloadOutlined />} onClick={handleReload} loading={loading}>
                Reload
              </Button>
              <Button onClick={() => navigate(groupMembersPath(groupId))}>Members</Button>
              {/* TODO(permissions): gate Save behind PermissionGuard once the backend permission contract exists. */}
              <Button type="primary" onClick={handleSave} loading={saving} disabled={!dirty}>
                Save
              </Button>
            </FormPageToolbar>
            <Space wrap>
              <Select<PermissionFilter>
                value={filter}
                onChange={setFilter}
                options={permissionFilterOptions}
                style={{ width: 150 }}
                aria-label="Filter permissions"
              />
              <Input.Search
                allowClear
                placeholder="Search permissions"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={commitSearch}
                style={{ width: '100%', maxWidth: 240 }}
                aria-label="Search permissions"
              />
            </Space>
          </Space>
        }
      />

      {visible.length === 0 ? (
        <EmptyState description={search || filter !== 'all' ? 'No permissions match your search or filter.' : 'No permissions available.'} />
      ) : twoColumns ? (
        <Row gutter={16} align="top">
          {[leftHalf, rightHalf].map((half, index) => (
            <Col key={index} span={12}>
              <GroupPermissionsTable
                permissions={half}
                draft={draft}
                loading={loading}
                onAssignChange={handleAssignChange}
                onProtectedChange={handleProtectedChange}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <GroupPermissionsTable
          permissions={visible}
          draft={draft}
          loading={loading}
          onAssignChange={handleAssignChange}
          onProtectedChange={handleProtectedChange}
        />
      )}
    </Space>
  )
}

export default GroupPermissionsPage
