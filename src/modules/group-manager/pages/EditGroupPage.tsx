import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import GroupForm from '../components/GroupForm'
import { groupEditPath, groupManagerPath, groupMembersPath, groupPermissionsPath } from '../group-manager.constants'
import { getGroupDetails, getGroupDomainOptions, updateGroup } from '../group-manager.service'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import type { GroupDetails, GroupFormValues } from '../group-manager.types'

const EDIT_GROUP_FORM_ID = 'edit-group-form'

const EditGroupPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { groupId } = useParams<{ groupId: string }>()

  const [details, setDetails] = useState<GroupDetails | null>(null)
  const [domainOptions, setDomainOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const goBack = () => navigate(groupManagerPath)

  const load = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const [group, domains] = await Promise.all([getGroupDetails(groupId), getGroupDomainOptions()])
      // Keep the group's own domain selectable even if the shared list does not include it.
      const options =
        group.domain_id && !domains.options.some((d) => d.id === group.domain_id)
          ? [...domains.options, { id: group.domain_id, name: group.domain_name ?? group.domain_id }]
          : domains.options
      setDomainOptions(options)
      setDetails(group)
    } catch (err) {
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load this group.')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (values: GroupFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      // Domain is locked on Edit: send the saved value, never the form copy. A protected group's name
      // and level are ignored by the service, which keeps its stored values.
      await updateGroup(details.group_uuid, { ...values, domain_id: details.domain_id })
      message.success(`Group "${details.group_protected ? details.group_name : values.group_name.trim()}" updated successfully.`)
      navigate(groupManagerPath)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update group.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading) return <LoadingState rows={6} />
  if (notFound || !details || !groupId) {
    return <EmptyState description="Group not found." action={<Button onClick={goBack}>Back to Group Manager</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title={`Edit Group (${details.group_name})`}
        toolbar={
          <FormPageToolbar onBack={goBack}>
            <Button onClick={() => navigate(groupPermissionsPath(groupId), { state: { returnTo: groupEditPath(groupId) } })}>Permissions</Button>
            <Button onClick={() => navigate(groupMembersPath(groupId))}>Members</Button>
            {/* TODO(permissions): gate Permissions / Members / Save behind PermissionGuard once the backend permission contract exists. */}
            <Button type="primary" htmlType="submit" form={EDIT_GROUP_FORM_ID} loading={submitting}>
              Save
            </Button>
          </FormPageToolbar>
        }
      />
      <GroupForm
        formId={EDIT_GROUP_FORM_ID}
        mode="edit"
        groupId={details.group_uuid}
        domainOptions={domainOptions}
        nameLocked={details.group_protected}
        initialValues={{ group_name: details.group_name, group_level: details.group_level, group_description: details.group_description ?? '', domain_id: details.domain_id }}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default EditGroupPage
