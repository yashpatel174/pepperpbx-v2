import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import GatewayForm from '../components/GatewayForm'
import { createGateway, getHiveGatewayDetails, getSbcDomains, getSipProfiles } from '../gateway.service'
import { getDefaultGatewayFormValues } from '../gateway.constants'
import useGatewayPermissions from '../useGatewayPermissions'
import type { GatewayFormValues, HiveGatewayDetails, SbcDomainOption, SipProfileOption } from '../gateway.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const ADD_GATEWAY_FORM_ID = 'add-gateway-form'

const AddGatewayPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManage } = useGatewayPermissions()

  const [hive, setHive] = useState<HiveGatewayDetails | null>(null)
  const [sbcDomains, setSbcDomains] = useState<SbcDomainOption[]>([])
  const [sipProfiles, setSipProfiles] = useState<SipProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  // A failed domain-change refetch shows an inline Retry above the form.
  const [optionsError, setOptionsError] = useState<{ domain: string; message: string } | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([getHiveGatewayDetails(), getSbcDomains(), getSipProfiles()])
      .then(([hiveDetails, sbc, profiles]) => {
        if (!active) return
        setHive(hiveDetails)
        setSbcDomains(sbc)
        setSipProfiles(profiles)
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

  const handleCancel = () => navigate('/account/gateways')

  // Matches the Axion reference: once a domain change is confirmed, re-fetch the domain-dependent
  // option lists (hive bootstrap, SBC domains, SIP profiles) for the newly selected domain, reusing
  // the exact same service calls the initial mount uses — no new service/API logic.
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const [hiveDetails, sbc, profiles] = await Promise.all([
        getHiveGatewayDetails(domainName),
        getSbcDomains(),
        getSipProfiles(),
      ])
      setHive(hiveDetails)
      setSbcDomains(sbc)
      setSipProfiles(profiles)
    } catch (err) {
      setOptionsError({ domain: domainName, message: getApiErrorMessage(err, 'The options for the selected domain failed to load.') })
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: GatewayFormValues) => {
    setSubmitting(true)
    try {
      const created = await createGateway(values)
      message.success(`Gateway "${created.gateway}" created successfully.`)
      // Follow the Axion reference: land on the new record's Edit page.
      navigate(`/account/gateways/${created.gateway_uuid}/edit`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create gateway.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/account/gateways')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Gateway"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>Cancel</Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={ADD_GATEWAY_FORM_ID} loading={submitting}>
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
      <GatewayForm
        formId={ADD_GATEWAY_FORM_ID}
        mode="create"
        initialValues={getDefaultGatewayFormValues(hive)}
        hive={hive}
        sbcDomains={sbcDomains}
        sipProfiles={sipProfiles}
        optionsLoading={optionsLoading}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        canManage={canManage}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddGatewayPage
