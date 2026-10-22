import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import IVRMenuForm from '../components/IVRMenuForm'
import { getHiveUserDetails, getIVRMenuById, updateIVRMenu } from '../ivr-menu.service'
import { ivrMenuPaths } from '../ivr-menu.constants'
import useIVRMenuOptions from '../useIVRMenuOptions'
import useIVRMenuPermissions from '../useIVRMenuPermissions'
import type { IVRMenuDetails, IVRMenuFormValues, IVRMenuHiveDetails } from '../ivr-menu.types'

const EDIT_FORM_ID = 'edit-ivr-menu-form'

const numberToField = (value?: number) => (value === undefined ? undefined : String(value))

/** Stored record → form values: numbers become the text inputs' strings, options' `order` a select value. */
const toFormValues = (details: IVRMenuDetails): IVRMenuFormValues => ({
  domain_name: details.domain_name,
  ivr_menu_context: details.ivr_menu_context || details.domain_name,
  ivr_menu_name: details.ivr_menu_name,
  ivr_menu_extension: details.ivr_menu_extension,
  ivr_menu_parent_uuid: details.ivr_menu_parent_uuid,
  ivr_menu_language: details.ivr_menu_language,
  ivr_menu_greet_long: details.ivr_menu_greet_long,
  ivr_menu_greet_short: details.ivr_menu_greet_short,
  ivr_menu_timeout: String(details.ivr_menu_timeout),
  exit_action: details.exit_action,
  ivr_menu_ringback: details.ivr_menu_ringback,
  ivr_menu_cid_prefix: details.ivr_menu_cid_prefix,
  ivr_menu_direct_dial: details.ivr_menu_direct_dial,
  ivr_menu_enabled: details.ivr_menu_enabled,
  ivr_menu_description: details.ivr_menu_description,
  options: details.options.map((row) => ({ ...row, order: String(row.order) })),
  ivr_menu_invalid_sound: details.ivr_menu_invalid_sound,
  ivr_menu_exit_sound: details.ivr_menu_exit_sound,
  ivr_menu_pin_number: details.ivr_menu_pin_number,
  ivr_menu_confirm_macro: details.ivr_menu_confirm_macro,
  ivr_menu_confirm_key: details.ivr_menu_confirm_key,
  ivr_menu_tts_engine: details.ivr_menu_tts_engine,
  ivr_menu_tts_voice: details.ivr_menu_tts_voice,
  ivr_menu_confirm_attempts: String(details.ivr_menu_confirm_attempts),
  ivr_menu_inter_digit_timeout: numberToField(details.ivr_menu_inter_digit_timeout),
  ivr_menu_max_failures: String(details.ivr_menu_max_failures),
  ivr_menu_max_timeouts: String(details.ivr_menu_max_timeouts),
  ivr_menu_digit_len: String(details.ivr_menu_digit_len),
})

const EditIVRMenuPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useIVRMenuPermissions()
  const { ivrMenuId } = useParams<{ ivrMenuId: string }>()

  const [details, setDetails] = useState<IVRMenuDetails | null>(null)
  const [hive, setHive] = useState<IVRMenuHiveDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (§14/§25).
  const canEditFields = canManageAll || canEdit

  // The record's domain options; Parent Menu excludes this IVR itself (§9/§26). Unlike Axion, the
  // page never waits on these, so an options failure can't leave the form on a spinner (§28).
  const options = useIVRMenuOptions(details?.domain_name, details?.ivr_menu_uuid)

  /** Record + bootstrap for the record's own domain. Initial load and Retry. */
  const load = useCallback(async () => {
    if (!ivrMenuId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getIVRMenuById(ivrMenuId)
      const hiveDetails = await getHiveUserDetails(record.domain_name)
      setDetails(record)
      setHive(hiveDetails)
      setFormKey((key) => key + 1)
    } catch (err) {
      // An unknown id gets a record-scoped EmptyState; retrying it can't help.
      if (isNotFoundError(err)) setNotFound(true)
      else setError(getApiErrorMessage(err, 'Failed to load this IVR menu.'))
    } finally {
      setLoading(false)
    }
  }, [ivrMenuId])

  useEffect(() => {
    if (!ivrMenuId) {
      setLoading(false)
      return
    }
    load()
  }, [load, ivrMenuId])

  const handleCancel = () => navigate(ivrMenuPaths.list)

  const handleSubmit = async (values: IVRMenuFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      // The domain is locked on Edit (§15) — always send the record's own.
      await updateIVRMenu(details.ivr_menu_uuid, { ...values, domain_name: details.domain_name })
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update IVR menu.'))
      setSubmitting(false)
      return
    }
    message.success(`IVR menu "${values.ivr_menu_name}" updated successfully.`)
    // Stay here and reload the saved record (§3 Edit step 7). The save already succeeded, so a
    // failed reload only warns and the form keeps the submitted values.
    try {
      const record = await getIVRMenuById(details.ivr_menu_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'IVR menu was saved, but reloading it failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />
  }

  if (loading) {
    return <LoadingState rows={10} />
  }

  if (!ivrMenuId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!ivrMenuId ? 'No IVR menu was specified.' : 'IVR menu not found.'}
        action={<Button onClick={handleCancel}>Back to IVR Menus</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit IVR Menu"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="pbx_ivrmenus_edit"> (or pbx_ivrmenus_all) once RBAC is populated. */}
              {canEditFields && (
                <Button type="primary" htmlType="submit" form={EDIT_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {canAccessForm ? (
        <IVRMenuForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          // Loaded for the record's own (locked) domain.
          extensionConfig={hive}
          options={options}
          optionsLoading={options.loading}
          optionsError={options.error}
          onRetryOptions={options.retry}
          canManage={canEditFields}
          // Axion's Edit-mode `canEdit` is view-or-edit, so the Advanced card shows (read-only) for viewers too (§9/§14).
          showAdvanced={canAccessForm}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditIVRMenuPage
