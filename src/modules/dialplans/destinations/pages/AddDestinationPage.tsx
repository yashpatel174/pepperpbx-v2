import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../../components/common/FormPageToolbar'
import LoadingState from '../../../../components/feedback/LoadingState'
import ErrorState from '../../../../components/feedback/ErrorState'
import DestinationForm from '../components/DestinationForm'
import { createDestination, getActionOptions, getFaxOptions, getHiveDestinationDetails, getMusicOnHoldOptions } from '../destination.service'
import { getDefaultDestinationFormValues } from '../destination.constants'
import useDestinationPermissions from '../useDestinationPermissions'
import type { ActionOptionGroup, DestinationFormValues, HiveDestinationDetails, HoldMusicGroup, SelectOption } from '../destination.types'

const ADD_DESTINATION_FORM_ID = 'add-destination-form'

const AddDestinationPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManage, canUseFreeText } = useDestinationPermissions()

  const [hive, setHive] = useState<HiveDestinationDetails | null>(null)
  const [actionOptions, setActionOptions] = useState<ActionOptionGroup[]>([])
  const [faxOptions, setFaxOptions] = useState<SelectOption[]>([])
  const [holdMusicOptions, setHoldMusicOptions] = useState<HoldMusicGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)

  useEffect(() => {
    let active = true
    getHiveDestinationDetails()
      .then(async (hiveDetails) => {
        if (!active) return
        setHive(hiveDetails)
        const [actions, fax, holdMusic] = await Promise.all([
          getActionOptions(hiveDetails.defaultDomain),
          getFaxOptions(hiveDetails.defaultDomain),
          getMusicOnHoldOptions(hiveDetails.defaultDomain),
        ])
        if (!active) return
        setActionOptions(actions)
        setFaxOptions(fax)
        setHoldMusicOptions(holdMusic)
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

  const handleCancel = () => navigate('/dialplans/destinations')

  // Matches the Axion reference: once a domain change is confirmed, re-fetch the domain-dependent
  // option lists (action/alternate-action, fax detection, hold music) for the newly selected
  // domain — see destinations.md §9.
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    try {
      const [actions, fax, holdMusic] = await Promise.all([
        getActionOptions(domainName),
        getFaxOptions(domainName),
        getMusicOnHoldOptions(domainName),
      ])
      setActionOptions(actions)
      setFaxOptions(fax)
      setHoldMusicOptions(holdMusic)
    } catch {
      message.error('Failed to refresh domain-dependent options.')
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: DestinationFormValues) => {
    setSubmitting(true)
    try {
      const created = await createDestination(values)
      message.success(`Destination ${created.destination_number} created successfully.`)
      // Follow the Axion reference: land on the new record's Edit page (destinations.md §3).
      navigate(`/dialplans/destinations/${created.destination_uuid}/edit`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create destination.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/dialplans/destinations')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Destination"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={ADD_DESTINATION_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <DestinationForm
        formId={ADD_DESTINATION_FORM_ID}
        mode="create"
        initialValues={getDefaultDestinationFormValues(hive)}
        hive={hive}
        actionOptions={actionOptions}
        faxOptions={faxOptions}
        holdMusicOptions={holdMusicOptions}
        optionsLoading={optionsLoading}
        canManage={canManage}
        canUseFreeText={canUseFreeText}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddDestinationPage
