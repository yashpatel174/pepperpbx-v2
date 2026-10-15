import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import GroupForm from '../components/GroupForm'
import GroupMembersModal from '../components/GroupMembersModal'
import { groupEditPath, groupManagerPath, groupPermissionsPath } from '../group-manager.constants'
import type { GroupPermissionsLocationState } from '../group-manager.constants'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import { createGroup, getAssignableUsers, getGroupDomainOptions } from '../group-manager.service'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { GroupFormValues, GroupMember } from '../group-manager.types'

const ADD_GROUP_FORM_ID = 'add-group-form'

/** Where to go once the group has been created: the list (Save) or its Permissions page (Permissions). */
type AfterCreate = 'list' | 'permissions'

const AddGroupPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const currentDomain = useCurrentDomain()
  const [submitting, setSubmitting] = useState(false)
  const [domainOptions, setDomainOptions] = useState<{ id: string; name: string }[] | null>(null)
  const [optionsError, setOptionsError] = useState(false)
  const [users, setUsers] = useState<GroupMember[]>([])
  // Staged here until the group is created, then sent in the create request.
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [membersOpen, setMembersOpen] = useState(false)
  // Which toolbar button submitted the form. Both submit the same validated form.
  const afterCreateRef = useRef<AfterCreate>('list')

  useEffect(() => {
    let active = true
    setOptionsError(false)
    Promise.all([getGroupDomainOptions(), getAssignableUsers()])
      .then(([domains, assignableUsers]) => {
        if (!active) return
        setDomainOptions(domains.options)
        setUsers(assignableUsers)
      })
      .catch(() => active && setOptionsError(true))
    return () => {
      active = false
    }
  }, [])

  const goBack = () => navigate(groupManagerPath)

  const handleSubmit = async (values: GroupFormValues) => {
    setSubmitting(true)
    try {
      const created = await createGroup({ ...values, member_ids: memberIds })
      message.success(`Group "${values.group_name.trim()}" created successfully.`)
      if (afterCreateRef.current === 'permissions') {
        // Permissions need an existing group id, so the group is created first. `replace` swaps this
        // Add page out of the history (browser Back cannot return to an empty Add form and create a
        // duplicate); the permissions page's Back button returns to this group's Edit page.
        const state: GroupPermissionsLocationState = { returnTo: groupEditPath(created.group_uuid) }
        navigate(groupPermissionsPath(created.group_uuid), { replace: true, state })
      } else {
        navigate(groupManagerPath)
      }
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create group.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (optionsError) return <ErrorState message="Failed to load domains." onRetry={() => navigate(0)} />
  if (!domainOptions) return <LoadingState rows={4} />

  // Default to the active domain when it is one of the options; otherwise leave it empty (global).
  const defaultDomainId = domainOptions.some((d) => d.id === currentDomain?.id) ? currentDomain?.id : undefined

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Group"
        toolbar={
          <FormPageToolbar onBack={goBack}>
            <Button
              htmlType="submit"
              form={ADD_GROUP_FORM_ID}
              loading={submitting}
              onClick={() => {
                afterCreateRef.current = 'permissions'
              }}
            >
              Permissions
            </Button>
            <Button onClick={() => setMembersOpen(true)}>Members{memberIds.length > 0 ? ` (${memberIds.length})` : ''}</Button>
            {/* TODO(permissions): gate Permissions / Members / Save behind PermissionGuard once the backend permission contract exists. */}
            <Button
              type="primary"
              htmlType="submit"
              form={ADD_GROUP_FORM_ID}
              loading={submitting}
              onClick={() => {
                afterCreateRef.current = 'list'
              }}
            >
              Save
            </Button>
          </FormPageToolbar>
        }
      />
      <GroupForm
        formId={ADD_GROUP_FORM_ID}
        mode="create"
        initialValues={{ group_name: '', group_level: 10, group_description: '', domain_id: defaultDomainId }}
        domainOptions={domainOptions}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
      <GroupMembersModal
        open={membersOpen}
        users={users}
        value={memberIds}
        onApply={(ids) => {
          setMemberIds(ids)
          setMembersOpen(false)
        }}
        onCancel={() => setMembersOpen(false)}
      />
    </Space>
  )
}

export default AddGroupPage
