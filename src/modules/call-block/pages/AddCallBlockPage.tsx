import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import CallBlockForm from '../components/CallBlockForm'
import { createCallBlock, getCallBlockActionOptions, getCallBlockExtensionOptions, getHiveCallBlockDetails } from '../call-block.service'
import { getDefaultCallBlockFormValues } from '../call-block.constants'
import useCallBlockPermissions from '../useCallBlockPermissions'
import type { CallBlockFormValues, HiveCallBlockDetails, SelectOption } from '../call-block.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const ADD_CALL_BLOCK_FORM_ID = 'add-call-block-form'

const AddCallBlockPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useCallBlockPermissions()

  const [hive, setHive] = useState<HiveCallBlockDetails | null>(null)
  const [extensionOptions, setExtensionOptions] = useState<SelectOption[]>([])
  const [actionOptions, setActionOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  // A failed domain-change refetch shows an inline Retry above the form.
  const [optionsError, setOptionsError] = useState<{ domain: string; message: string } | null>(null)

  const canAccessForm = canManageAll || canAdd

  useEffect(() => {
    let active = true
    getHiveCallBlockDetails()
      .then(async (hiveDetails) => {
        if (!active) return
        setHive(hiveDetails)
        const [extensions, actions] = await Promise.all([
          getCallBlockExtensionOptions(hiveDetails.defaultDomain),
          getCallBlockActionOptions(hiveDetails.defaultDomain),
        ])
        if (!active) return
        setExtensionOptions(extensions)
        setActionOptions(actions)
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

  const handleCancel = () => navigate('/call-block')

  // Matches the audit: once a domain change is dismissed, re-fetch the domain-dependent option
  // lists (extension/action) for the newly selected domain — call-block.md §9.
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const [extensions, actions] = await Promise.all([getCallBlockExtensionOptions(domainName), getCallBlockActionOptions(domainName)])
      setExtensionOptions(extensions)
      setActionOptions(actions)
    } catch (err) {
      setOptionsError({ domain: domainName, message: getApiErrorMessage(err, 'The options for the selected domain failed to load.') })
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: CallBlockFormValues) => {
    setSubmitting(true)
    try {
      const created = await createCallBlock(values)
      const label = values.call_block_name || values.call_block_number
      message.success(label ? `Call block "${label}" created successfully.` : 'Call block created successfully.')
      // Matches the audit: Create success navigates to Edit — UNLESS the user has only the Add
      // permission (no view/edit/all), in which case it navigates to the List instead, since
      // they wouldn't be able to open the Edit page anyway (call-block.md §3/§19/§33). With RBAC
      // still foundation-only (empty store = everything granted), this "only add" branch is
      // currently unreachable in practice, but the logic is correct and ready for when real
      // granular permissions arrive.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? '/call-block' : `/call-block/${created.call_block_uuid}/edit`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create call block.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/call-block')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Call Block"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canAccessForm && (
              <Button type="primary" htmlType="submit" form={ADD_CALL_BLOCK_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {optionsError && (
        <ErrorState
          type="warning"
          message="Some data couldn't be loaded"
          description={optionsError.message}
          onRetry={() => handleDomainConfirmed(optionsError.domain)}
        />
      )}
      <CallBlockForm
        formId={ADD_CALL_BLOCK_FORM_ID}
        mode="create"
        initialValues={getDefaultCallBlockFormValues(hive)}
        hive={hive}
        extensionOptions={extensionOptions}
        actionOptions={actionOptions}
        optionsLoading={optionsLoading}
        canManage={canAccessForm}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddCallBlockPage
