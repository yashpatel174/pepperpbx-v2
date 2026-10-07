import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import AnnouncementForm from '../components/AnnouncementForm'
import { createAnnouncement, getExecuteActionOptions, getHiveAnnouncementDetails, getPlayActionOptions } from '../announcement.service'
import { getDefaultAnnouncementFormValues } from '../announcement.constants'
import useAnnouncementPermissions from '../useAnnouncementPermissions'
import type { ActionOptionGroup, AnnouncementFormValues, HiveAnnouncementDetails } from '../announcement.types'

const ADD_ANNOUNCEMENT_FORM_ID = 'add-announcement-form'

const AddAnnouncementPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView, canUseFreeText } = useAnnouncementPermissions()

  const [hive, setHive] = useState<HiveAnnouncementDetails | null>(null)
  const [playOptions, setPlayOptions] = useState<ActionOptionGroup[]>([])
  const [executeOptions, setExecuteOptions] = useState<ActionOptionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)

  const canAccessForm = canManageAll || canAdd

  useEffect(() => {
    let active = true
    getHiveAnnouncementDetails()
      .then(async (hiveDetails) => {
        if (!active) return
        setHive(hiveDetails)
        const [play, execute] = await Promise.all([
          getPlayActionOptions(hiveDetails.defaultDomain),
          getExecuteActionOptions(hiveDetails.defaultDomain),
        ])
        if (!active) return
        setPlayOptions(play)
        setExecuteOptions(execute)
      })
      .catch(() => {
        if (active) setError('Failed to load account details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleCancel = () => navigate('/announcements')

  // Matches the audit: once a domain change is confirmed, re-fetch the domain-dependent option
  // lists (play/execute actions) for the newly selected domain — announcements.md §9.
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    try {
      const [play, execute] = await Promise.all([getPlayActionOptions(domainName), getExecuteActionOptions(domainName)])
      setPlayOptions(play)
      setExecuteOptions(execute)
    } catch {
      message.error('Failed to refresh domain-dependent options.')
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: AnnouncementFormValues) => {
    setSubmitting(true)
    try {
      const created = await createAnnouncement(values)
      message.success(`Announcement ${created.phrase_name} created successfully.`)
      // Matches the audit: Create success navigates to Edit for the new record — UNLESS the user
      // has only the Add permission (no view/edit/all), in which case it navigates to the List
      // instead, since they wouldn't be able to open the Edit page anyway (announcements.md
      // §3/§19/§33). With RBAC still foundation-only (empty store = everything granted), this
      // "only add" branch is currently unreachable in practice, but the logic is correct and
      // ready for when real granular permissions arrive.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? '/announcements' : `/announcements/${created.phrase_uuid}/edit`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/announcements')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Announcement"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canAccessForm && (
              <Button type="primary" htmlType="submit" form={ADD_ANNOUNCEMENT_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <AnnouncementForm
        formId={ADD_ANNOUNCEMENT_FORM_ID}
        mode="create"
        initialValues={getDefaultAnnouncementFormValues(hive)}
        hive={hive}
        playOptions={playOptions}
        executeOptions={executeOptions}
        optionsLoading={optionsLoading}
        canManage={canAccessForm}
        canUseFreeText={canUseFreeText}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddAnnouncementPage
