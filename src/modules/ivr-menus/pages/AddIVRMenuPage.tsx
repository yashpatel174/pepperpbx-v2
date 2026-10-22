import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import { getApiErrorMessage } from '../../../services/api/apiError'
import IVRMenuForm from '../components/IVRMenuForm'
import { createIVRMenu, getHiveUserDetails } from '../ivr-menu.service'
import { getDefaultIVRMenuFormValues, ivrMenuPaths } from '../ivr-menu.constants'
import useIVRMenuOptions from '../useIVRMenuOptions'
import useIVRMenuPermissions from '../useIVRMenuPermissions'
import type { IVRMenuFormValues, IVRMenuHiveDetails } from '../ivr-menu.types'

const ADD_FORM_ID = 'add-ivr-menu-form'

const AddIVRMenuPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useIVRMenuPermissions()

  const [hive, setHive] = useState<IVRMenuHiveDetails | null>(null)
  /** The domain `hive`'s extension range/autoExt belong to — they only apply while it's the selected one. */
  const [hiveDomain, setHiveDomain] = useState<string | undefined>(undefined)
  const [hiveError, setHiveError] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<IVRMenuFormValues> | null>(null)
  const [formDomain, setFormDomain] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  // The Add form starts on the app's current domain (Axion: `localStorage['defaultDomain']`,
  // falling back to the server default, §15). Captured once — the bootstrap itself may seed the store.
  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)
  // Only the latest domain-change bootstrap may apply.
  const domainRequestRef = useRef(0)

  // The six option lists load on their own and reload on every domain change (§3/§9).
  const options = useIVRMenuOptions(formDomain)

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hiveDetails = await getHiveUserDetails(initialDomainRef.current)
      const requested = initialDomainRef.current
      const domain = requested && hiveDetails.domainOptions.includes(requested) ? requested : hiveDetails.defaultDomain
      setHive(hiveDetails)
      setHiveDomain(domain)
      setFormDomain(domain)
      setInitialValues(getDefaultIVRMenuFormValues(hiveDetails, domain))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load IVR menu settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const handleCancel = () => navigate(ivrMenuPaths.list)

  /**
   * Loads one domain's Hive details (range + autoExt). Until it succeeds, `extensionConfig` below is
   * null, so the extension is never validated against the previously selected domain's range.
   */
  const loadDomainHive = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setHiveError(false)
    try {
      const hiveDetails = await getHiveUserDetails(domainName)
      if (requestId !== domainRequestRef.current) return
      setHive(hiveDetails)
      setHiveDomain(domainName)
    } catch (err) {
      if (requestId !== domainRequestRef.current) return
      setHiveError(true)
      message.error(getApiErrorMessage(err, 'Failed to load the extension settings for this domain.'))
    }
  }

  // A confirmed domain change reloads that domain's Hive details; the options hook reloads its six
  // lists from `formDomain` (§9).
  const handleDomainConfirmed = (domainName: string) => {
    setFormDomain(domainName)
    loadDomainHive(domainName)
  }

  const extensionConfig = hive && hiveDomain === formDomain ? hive : null

  const handleSubmit = async (values: IVRMenuFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createIVRMenu(values)
      message.success(`IVR menu "${values.ivr_menu_name}" created successfully.`)
      // Add-only users go back to the list; everyone else lands on the new record's Edit page
      // (§3 Create step 8). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? ivrMenuPaths.list : ivrMenuPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create IVR menu.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={bootstrap} />
  }

  if (loading || !hive || !initialValues) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add IVR Menu"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="pbx_ivrmenus_add"> (or pbx_ivrmenus_all) once RBAC is populated. */}
              {canAccessForm && (
                <Button type="primary" htmlType="submit" form={ADD_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {canAccessForm ? (
        <IVRMenuForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          extensionConfig={extensionConfig}
          extensionConfigError={hiveError}
          onRetryExtensionConfig={() => formDomain && loadDomainHive(formDomain)}
          options={options}
          optionsLoading={options.loading}
          optionsError={options.error}
          onRetryOptions={options.retry}
          canManage={canAccessForm}
          showAdvanced={canManageAll || canAdd || canEdit}
          submitting={submitting}
          onSubmit={handleSubmit}
          onDomainConfirmed={handleDomainConfirmed}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddIVRMenuPage
