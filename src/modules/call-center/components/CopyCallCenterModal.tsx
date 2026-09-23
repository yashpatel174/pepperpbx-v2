import { useEffect } from 'react'
import { App, Form, Input, Modal } from 'antd'
import ErrorState from '../../../components/feedback/ErrorState'
import { extensionRangeRule, nameFormatRule, nameRequiredRule, noEdgeWhitespaceRule } from '../call-center.validation'
import type { CallCenter, HiveCallCenterDetails } from '../call-center.types'

interface CopyCallCenterModalProps {
  open: boolean
  target: CallCenter | null
  /** Freshly-fetched hive bootstrap for the target's own domain (autoExtension/range/exclude) —
   * mirrors Destinations' CopyDestinationModal `suggestedNumber` convention, extended with the
   * extension-range data the Copy popup's `new_extension` field also needs (call-center.md §8:
   * "same extension-range rule as queue form, pre-filled with domain's autoExt"). Null while the
   * page is still fetching it, or when that fetch failed (`hiveError`). */
  hive: HiveCallCenterDetails | null
  /** The hive fetch failed — shows an ErrorState with Retry instead of an endless OK spinner. */
  hiveError: boolean
  onRetryHive: () => void
  submitting: boolean
  onSubmit: (values: { name: string; extension: string }) => void | Promise<void>
  onCancel: () => void
}

interface CopyFormValues {
  new_name: string
  new_extension: string
}

/**
 * Copy popup — a small inline form, not a full page, matching call-center.md §9/§20's Copy modal
 * (New Name + New Extension). Copies within the source record's own domain (not user-selectable).
 */
const CopyCallCenterModal = ({ open, target, hive, hiveError, onRetryHive, submitting, onSubmit, onCancel }: CopyCallCenterModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()
  const { message } = App.useApp()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ new_name: '', new_extension: hive?.autoExtension ?? '' })
    } else {
      form.resetFields()
    }
  }, [open, hive, form])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => onSubmit({ name: values.new_name, extension: values.new_extension }))
      .catch(() => message.error('Please fix the highlighted fields.'))
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Call Center Queue ${target.name}` : 'Copy Call Center Queue'}
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      confirmLoading={submitting || (!hive && !hiveError)}
      okButtonProps={{ disabled: hiveError }}
      destroyOnHidden
    >
      {hiveError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorState message="Failed to load domain details for copy." onRetry={onRetryHive} />
        </div>
      )}
      <Form<CopyFormValues> form={form} layout="vertical">
        <Form.Item
          name="new_name"
          label="Name"
          validateFirst
          rules={[nameRequiredRule, nameFormatRule, noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter new queue name" aria-label="New queue name" />
        </Form.Item>

        <Form.Item
          name="new_extension"
          label="Extension"
          tooltip="Pre-filled with the next suggested extension for this domain"
          validateFirst
          rules={hive ? extensionRangeRule(hive) : [{ required: true, message: 'Extension is required' }]}
        >
          <Input placeholder="Enter new extension" aria-label="New extension" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyCallCenterModal
