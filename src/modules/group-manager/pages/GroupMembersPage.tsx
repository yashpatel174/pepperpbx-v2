import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Input, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import GroupMembersTable from '../components/GroupMembersTable'
import { groupManagerPath, groupPermissionsPath } from '../group-manager.constants'
import { getGroupMembers, saveGroupMembers } from '../group-manager.service'
import useUnsavedChangesGuard from '../useUnsavedChangesGuard'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import type { GroupMember, GroupMembersData } from '../group-manager.types'

const SEARCH_DEBOUNCE_MS = 400

const sameIds = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i])

const GroupMembersPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { groupId } = useParams<{ groupId: string }>()

  const [data, setData] = useState<GroupMembersData | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [draftIds, setDraftIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const dirty = useMemo(() => !sameIds(savedIds, draftIds), [savedIds, draftIds])
  useUnsavedChangesGuard(dirty)

  // Request identity, as in useAnnouncements: a slower earlier response (another group, or a retry) can't overwrite the latest one.
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!groupId) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const result = await getGroupMembers(groupId)
      if (requestId !== requestRef.current) return
      const ids = result.members.map((m) => m.user_uuid)
      setData(result)
      setSavedIds(ids)
      setDraftIds(ids)
    } catch (err) {
      if (requestId !== requestRef.current) return
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load group members.')
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const usersById = useMemo(() => new Map((data?.allUsers ?? []).map((u) => [u.user_uuid, u])), [data])

  const members = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return draftIds
      .map((id) => usersById.get(id))
      .filter((u): u is GroupMember => !!u)
      .filter((u) => !needle || [u.username, u.full_name, u.email].some((v) => v.toLowerCase().includes(needle)))
  }, [draftIds, usersById, search])

  const handleSave = async () => {
    if (!groupId) return
    setSaving(true)
    try {
      await saveGroupMembers(groupId, draftIds)
      setSavedIds([...draftIds])
      message.success(`Members saved (${draftIds.length} in group).`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to save members.'))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading && !data) return <LoadingState rows={8} />
  if (notFound || !data || !groupId) {
    return <EmptyState description="Group not found." action={<Button onClick={() => navigate(groupManagerPath)}>Back to Group Manager</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title={`Group Members (${data.group.group_name})`}
        count={draftIds.length}
        toolbar={
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <FormPageToolbar onBack={() => navigate(groupManagerPath)}>
              <Button onClick={() => navigate(groupPermissionsPath(groupId))}>Permissions</Button>
              {/* TODO(permissions): gate Save behind PermissionGuard once the backend permission contract exists. */}
              <Button type="primary" onClick={handleSave} loading={saving} disabled={!dirty}>
                Save
              </Button>
            </FormPageToolbar>
            <Space wrap>
              <Input.Search
                allowClear
                placeholder="Search members"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={commitSearch}
                style={{ width: '100%', maxWidth: 240 }}
                aria-label="Search members"
              />
            </Space>
          </Space>
        }
      />

      {members.length === 0 ? (
        <EmptyState description={search ? 'No members match your search.' : 'This group has no members.'} />
      ) : (
        <GroupMembersTable members={members} loading={loading} />
      )}
    </Space>
  )
}

export default GroupMembersPage
