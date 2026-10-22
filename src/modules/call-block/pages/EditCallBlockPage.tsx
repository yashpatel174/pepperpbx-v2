import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import CallBlockForm from '../components/CallBlockForm'
import {
  getCallBlockActionOptions,
  getCallBlockDetails,
  getCallBlockExtensionOptions,
  getHiveCallBlockDetails,
  updateCallBlock,
} from '../call-block.service'
import useCallBlockPermissions from '../useCallBlockPermissions'
import type { CallBlockDetails, CallBlockFormValues, HiveCallBlockDetails, SelectOption } from '../call-block.types'

const EDIT_CALL_BLOCK_FORM_ID = 'edit-call-block-form'

/** Maps the stored/API details back into the form model — a straight passthrough (one shared shape). */
const toFormValues = (details: CallBlockDetails): CallBlockFormValues => ({ ...details })

const EditCallBlockPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit } = useCallBlockPermissions()
  const { callBlockId } = useParams<{ callBlockId: string }>()

  const [hive, setHive] = useState<HiveCallBlockDetails | null>(null)
  const [extensionOptions, setExtensionOptions] = useState<SelectOption[]>([])
  const [actionOptions, setActionOptions] = useState<SelectOption[]>([])
  const [details, setDetails] = useState<CallBlockDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  // View-only users see the form but can't submit changes — matches the audit's
  // `disabledFieldsBasic` (call-block.md §14/§25/§33).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!callBlockId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const callBlockDetails = await getCallBlockDetails(callBlockId)
        // Always supply the record's own domain here — matches the fix already established for
        // Gateways'/Outbound Routes'/Announcements' Edit screens (the Axion reference has a
        // confirmed bug of calling hive bootstrap with no domain at all on some Edit screens).
        const [hiveDetails, extensions, actions] = await Promise.all([
          getHiveCallBlockDetails(callBlockDetails.domain_name),
          getCallBlockExtensionOptions(callBlockDetails.domain_name),
          getCallBlockActionOptions(callBlockDetails.domain_name),
        ])
        setDetails(callBlockDetails)
        setHive(hiveDetails)
        setExtensionOptions(extensions)
        setActionOptions(actions)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this call block.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [callBlockId]
  )

  useEffect(() => {
    // Matches the audit: a missing call block id redirects straight back to the List
    // (call-block.md §3's Edit flow, step 1).
    if (!callBlockId) {
      navigate('/call-block')
      return
    }
    load(true)
  }, [load, callBlockId, navigate])

  const handleCancel = () => navigate('/call-block')

  const handleSubmit = async (values: CallBlockFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateCallBlock(details.call_block_uuid, values)
      const label = values.call_block_name || values.call_block_number
      message.success(label ? `Call block "${label}" updated successfully.` : 'Call block updated successfully.')
      // Matches the audit exactly: Update success does NOT navigate away — it re-fetches details
      // and re-populates the same Edit page in place (call-block.md §3/§19), matching
      // Announcements' identical Edit-success behavior (unlike Outbound Routes'/Destinations'
      // "navigate back to List" convention).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update call block.'))
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

  if (notFound || !details || !hive) {
    return <EmptyState description="Call block not found." action={<Button onClick={handleCancel}>Back to Call Block</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Call Block"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {/* View-only users get a read-only form with no Save at all. */}
            {canEditFields && (
              <Button type="primary" htmlType="submit" form={EDIT_CALL_BLOCK_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <CallBlockForm
        key={formKey}
        formId={EDIT_CALL_BLOCK_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        hive={hive}
        extensionOptions={extensionOptions}
        actionOptions={actionOptions}
        canManage={canEditFields}
        submitting={submitting}
        onSubmit={handleSubmit}
        recentCallsContext={{ domainName: details.domain_name, name: details.call_block_name, number: details.call_block_number }}
      />
    </Space>
  )
}

export default EditCallBlockPage
