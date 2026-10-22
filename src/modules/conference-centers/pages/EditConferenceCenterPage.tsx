import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ConferenceCenterForm from '../components/ConferenceCenterForm'
import { getConferenceCenterById, getGreetingOptions, getHiveUserDetails, updateConferenceCenter } from '../conference-center.service'
import { conferenceCenterPaths } from '../conference-center.constants'
import useConferenceCenterPermissions from '../useConferenceCenterPermissions'
import type { ConferenceCenterDetails, GreetingOption, HiveUserConferenceDetails, ConferenceCenterFormValues } from '../conference-center.types'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'

const EDIT_FORM_ID = 'edit-conference-center-form'
const greetingsErrorFallback = 'The greeting options for this domain failed to load.'

/** Details already arrive normalized (boolean status, numeric PIN length, trimmed description). */
const toFormValues = (details: ConferenceCenterDetails): ConferenceCenterFormValues => ({ ...details })

const EditConferenceCenterPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useConferenceCenterPermissions()
  const { conferenceCenterId } = useParams<{ conferenceCenterId: string }>()

  const [details, setDetails] = useState<ConferenceCenterDetails | null>(null)
  const [hive, setHive] = useState<HiveUserConferenceDetails | null>(null)
  const [greetingOptions, setGreetingOptions] = useState<GreetingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  // Greeting options load on their own: a failure shows an inline Retry instead of blocking the form.
  const [greetingsError, setGreetingsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (conference-centers.md §14/§25).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!conferenceCenterId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      setGreetingsError(null)
      try {
        const record = await getConferenceCenterById(conferenceCenterId)
        // Bootstrap with the record's own domain (Axion calls it with no domain on Edit).
        const [hiveDetails, greetings] = await Promise.all([
          getHiveUserDetails(record.domain_name),
          getGreetingOptions(record.domain_name).catch((err: unknown) => {
            setGreetingsError(getApiErrorMessage(err, greetingsErrorFallback))
            return []
          }),
        ])
        setDetails(record)
        setHive(hiveDetails)
        setGreetingOptions(greetings)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this conference center.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [conferenceCenterId]
  )

  useEffect(() => {
    if (!conferenceCenterId) {
      setLoading(false)
      return
    }
    load(true)
  }, [load, conferenceCenterId])

  const handleCancel = () => navigate(conferenceCenterPaths.list)

  const retryGreetings = async () => {
    if (!details) return
    setGreetingsError(null)
    try {
      setGreetingOptions(await getGreetingOptions(details.domain_name))
    } catch (err) {
      setGreetingsError(getApiErrorMessage(err, greetingsErrorFallback))
    }
  }

  const handleSubmit = async (values: ConferenceCenterFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateConferenceCenter(details.conference_center_uuid, values)
      message.success(`Conference center "${values.conference_center_name}" updated successfully.`)
      // Stay on this page and reload the server-confirmed record (conference-centers.md §3/§19).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update conference center.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load(true)} />
  }

  if (loading) {
    return <LoadingState rows={10} />
  }

  if (!conferenceCenterId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!conferenceCenterId ? 'No conference center was specified.' : 'Conference center not found.'}
        action={<Button onClick={handleCancel}>Back to Conference Centers</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Conference Center"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated. */}
              {canEditFields && (
                <Button type="primary" htmlType="submit" form={EDIT_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {greetingsError && (
        <ErrorState type="warning" message="Some data couldn't be loaded" description={greetingsError} onRetry={retryGreetings} />
      )}
      {canAccessForm ? (
        <ConferenceCenterForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          greetingOptions={greetingOptions}
          canManage={canEditFields}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditConferenceCenterPage
