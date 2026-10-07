import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../../components/common/FormPageToolbar'
import LoadingState from '../../../../components/feedback/LoadingState'
import ErrorState from '../../../../components/feedback/ErrorState'
import OutboundRouteForm from '../components/OutboundRouteForm'
import { createOutboundRoute, getHiveOutboundRouteDetails, getOutboundRouteGatewayOptions, getSbcDomains } from '../outbound-route.service'
import { getDefaultOutboundRouteFormValues } from '../outbound-route.constants'
import useOutboundRoutePermissions from '../useOutboundRoutePermissions'
import type { HiveOutboundRouteDetails, OutboundRouteFormValues, OutboundRouteGatewayOption, SbcDomainOption } from '../outbound-route.types'

const ADD_OUTBOUND_ROUTE_FORM_ID = 'add-outbound-route-form'

const AddOutboundRoutePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManage } = useOutboundRoutePermissions()

  const [hive, setHive] = useState<HiveOutboundRouteDetails | null>(null)
  const [sbcDomains, setSbcDomains] = useState<SbcDomainOption[]>([])
  const [gatewayOptions, setGatewayOptions] = useState<OutboundRouteGatewayOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)

  useEffect(() => {
    let active = true
    getHiveOutboundRouteDetails()
      .then(async (hiveDetails) => {
        if (!active) return
        setHive(hiveDetails)
        const [sbc, gateways] = await Promise.all([getSbcDomains(), getOutboundRouteGatewayOptions(hiveDetails.defaultDomain)])
        if (!active) return
        setSbcDomains(sbc)
        setGatewayOptions(gateways)
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

  const handleCancel = () => navigate('/dialplans/outbound-routes')

  // Matches the audit: once a domain change is confirmed, re-fetch the domain-dependent option
  // lists (hive bootstrap, SBC domains, gateway options) for the newly selected domain — see
  // outbound-routes.md §9.
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    try {
      const [hiveDetails, sbc, gateways] = await Promise.all([
        getHiveOutboundRouteDetails(domainName),
        getSbcDomains(),
        getOutboundRouteGatewayOptions(domainName),
      ])
      setHive(hiveDetails)
      setSbcDomains(sbc)
      setGatewayOptions(gateways)
    } catch {
      message.error('Failed to refresh domain-dependent options.')
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: OutboundRouteFormValues) => {
    setSubmitting(true)
    try {
      const created = await createOutboundRoute(values)
      message.success(`Outbound route ${created.outbound_route_name} created successfully.`)
      // Matches the audit: Create success navigates back to the List (outbound-routes.md §3/§19),
      // unlike Destinations'/Gateways' "land on Edit" convention.
      navigate('/dialplans/outbound-routes')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create outbound route.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/dialplans/outbound-routes')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Outbound Route"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={ADD_OUTBOUND_ROUTE_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <OutboundRouteForm
        formId={ADD_OUTBOUND_ROUTE_FORM_ID}
        mode="create"
        initialValues={getDefaultOutboundRouteFormValues(hive)}
        hive={hive}
        sbcDomains={sbcDomains}
        gatewayOptions={gatewayOptions}
        optionsLoading={optionsLoading}
        canManage={canManage}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddOutboundRoutePage
