import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import GatewayForm from '../components/GatewayForm'
import { getGatewayDetails, getHiveGatewayDetails, getSbcDomains, getSipProfiles, updateGateway } from '../gateway.service'
import useGatewayPermissions from '../useGatewayPermissions'
import type { GatewayDetails, GatewayFormValues, HiveGatewayDetails, SbcDomainOption, SipProfileOption } from '../gateway.types'

const EDIT_GATEWAY_FORM_ID = 'edit-gateway-form'

/** Maps the stored/API details back into the form model. */
const toFormValues = (details: GatewayDetails): GatewayFormValues => ({
  gateway: details.gateway,
  username: details.username,
  password: details.password ?? '',
  from_user: details.from_user,
  domain_name: details.domain_name,
  sbcDomainIp: details.sbcDomainIp ?? '',
  proxy: details.proxy,
  realm: details.realm,
  expire_seconds: String(details.expire_seconds),
  retry_seconds: String(details.retry_seconds),
  context: details.context,
  profile: details.profile,
  register: details.register,
  enabled: details.enabled,
  description: details.description?.trim(),
  distinct_to: details.distinct_to,
  caller_id_in_from: details.caller_id_in_from,
  supress_cng: details.supress_cng,
  extension_in_contact: details.extension_in_contact,
  auth_username: details.auth_username,
  extension: details.extension,
  register_transport: details.register_transport,
  register_proxy: details.register_proxy,
  outbound_proxy: details.outbound_proxy,
  sip_cid_type: details.sip_cid_type,
  codec_prefs: details.codec_prefs,
  ping: details.ping,
  ping_min: details.ping_min,
  ping_max: details.ping_max,
  channels: details.channels === undefined ? undefined : String(details.channels),
  hostname: details.hostname,
})

const EditGatewayPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManage } = useGatewayPermissions()
  const { gatewayUuid } = useParams<{ gatewayUuid: string }>()

  const [hive, setHive] = useState<HiveGatewayDetails | null>(null)
  const [sbcDomains, setSbcDomains] = useState<SbcDomainOption[]>([])
  const [sipProfiles, setSipProfiles] = useState<SipProfileOption[]>([])
  const [details, setDetails] = useState<GatewayDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!gatewayUuid) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const gatewayDetails = await getGatewayDetails(gatewayUuid)
        // Always supply the gateway's own domain here — the Axion reference has a confirmed bug
        // where its Edit screen calls this with no domain at all; deliberately not reproduced.
        const [hiveDetails, sbc, profiles] = await Promise.all([
          getHiveGatewayDetails(gatewayDetails.domain_name),
          getSbcDomains(),
          getSipProfiles(),
        ])
        setDetails(gatewayDetails)
        setHive(hiveDetails)
        setSbcDomains(sbc)
        setSipProfiles(profiles)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this gateway.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [gatewayUuid]
  )

  useEffect(() => {
    if (!gatewayUuid) {
      navigate('/account/gateways')
      return
    }
    load(true)
  }, [load, gatewayUuid, navigate])

  const handleCancel = () => navigate('/account/gateways')

  const handleSubmit = async (values: GatewayFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      const updated = await updateGateway(details.gateway_uuid, values)
      message.success(`Gateway "${updated.gateway}" updated successfully.`)
      // Stay on the Edit page: re-fetch details and re-populate, matching the Axion reference.
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update gateway.'))
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
    return (
      <EmptyState
        description="Gateway not found."
        action={<Button onClick={handleCancel}>Back to Gateways</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Gateway"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>Cancel</Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={EDIT_GATEWAY_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <GatewayForm
        key={formKey}
        formId={EDIT_GATEWAY_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        excludeUuid={details.gateway_uuid}
        hive={hive}
        sbcDomains={sbcDomains}
        sipProfiles={sipProfiles}
        submitting={submitting}
        canManage={canManage}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default EditGatewayPage
