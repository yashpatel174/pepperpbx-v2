import { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import ErrorState from '../../../components/feedback/ErrorState'
import { extensionReuseNote } from '../ivr-menu.constants'
import { describeExtensionRange, extensionRules, nameRules } from '../ivr-menu.validation'
import type { IVRMenu, IVRMenuHiveDetails } from '../ivr-menu.types'

interface CopyFormValues {
  ivr_name: string
  new_extension: string
}

export interface CopyIVRMenuValues {
  name: string
  extension: string
}

interface CopyIVRMenuModalProps {
  open: boolean
  target: IVRMenu | null
  /** Hive bootstrap for the SOURCE record's own domain (autoExt + range) — null while loading. */
  hive: IVRMenuHiveDetails | null
  hiveError: boolean
  onRetryHive: () => void
  submitting: boolean
  onSubmit: (values: CopyIVRMenuValues) => void
  onCancel: () => void
}

/**
 * Row Copy (ivr-menus.md §3/§8/§20): Name + Extension. The copy stays in the source record's domain,
 * which isn't selectable here. Extension is pre-filled with that domain's `autoExt` once it arrives
 * (unless the user already typed one) and validated with the same range rules as Add/Edit.
 */
const CopyIVRMenuModal = ({ open, target, hive, hiveError, onRetryHive, submitting, onSubmit, onCancel }: CopyIVRMenuModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, target, form])

  useEffect(() => {
    if (!open || !hive || form.isFieldTouched('new_extension')) return
    form.setFieldsValue({ new_extension: hive.autoExt })
  }, [open, hive, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSubmit({ name: values.ivr_name, extension: values.new_extension })
    } catch {
      // Field errors are already shown inline.
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy IVR Menu ${target.ivr_menu_name}` : 'Copy IVR Menu'}
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      okButtonProps={{ disabled: !hive }}
      confirmLoading={submitting}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnHidden
    >
      {hiveError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorState message="Couldn't load the extension settings for this domain." onRetry={onRetryHive} />
        </div>
      )}
      <Form<CopyFormValues> form={form} layout="vertical" disabled={submitting}>
        <Form.Item name="ivr_name" label="Name" validateFirst rules={nameRules}>
          <Input placeholder="Enter new IVR menu name" aria-label="New IVR menu name" />
        </Form.Item>
        <Form.Item
          name="new_extension"
          label="Extension"
          tooltip={hive ? `Must be ${describeExtensionRange(hive)}` : undefined}
          extra={extensionReuseNote}
          validateFirst
          rules={hive ? extensionRules(hive) : [{ required: true, message: 'Extension required in number' }]}
        >
          <Input placeholder={hive ? 'Enter extension' : 'Loading…'} disabled={!hive || submitting} type={'number'} aria-label="New extension" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyIVRMenuModal
