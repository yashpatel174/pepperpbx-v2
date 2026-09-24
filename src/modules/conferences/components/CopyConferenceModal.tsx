import { useEffect } from 'react'
import { App, Form, Input, Modal } from 'antd'
import { extensionRangeRule, nameFormatRule, nameRequiredRule, noEdgeWhitespaceRule } from '../conference.validation'
import type { Conference, ConferenceHiveDetails } from '../conference.types'

interface CopyConferenceModalProps {
  open: boolean
  target: Conference | null
  /** Freshly-fetched hive bootstrap for the target's own domain (autoExtension/range/exclude) —
   * mirrors Call Center Queue's CopyCallCenterModal `hive` convention. Deliberately always fetched
   * for the source conference's own domain, not the caller's session-default domain — the audit
   * flags Axion's Copy flow as NOT enforcing this (conferences.md §15/§28: "may not use the source
   * conference's domain"), which this module does not reproduce (see ConferencesPage.tsx's
   * handleCopyClick). Null while the page is still fetching it. */
  hive: ConferenceHiveDetails | null
  submitting: boolean
  onSubmit: (values: { name: string; extension: string }) => void | Promise<void>
  onCancel: () => void
}

interface CopyFormValues {
  new_conference_name: string
  new_conference_extension: string
}

/**
 * Copy modal — a small inline form, not a full page, matching conferences.md §9/§20's Copy popup
 * (New Name + New Extension). Copies within the source record's own domain (not user-selectable).
 */
const CopyConferenceModal = ({ open, target, hive, submitting, onSubmit, onCancel }: CopyConferenceModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()
  const { message } = App.useApp()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ new_conference_name: '', new_conference_extension: hive?.autoExtension ?? '' })
    } else {
      form.resetFields()
    }
  }, [open, hive, form])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => onSubmit({ name: values.new_conference_name, extension: values.new_conference_extension }))
      .catch(() => message.error('Please fix the highlighted fields.'))
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Conference ${target.name}` : 'Copy Conference'}
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      confirmLoading={submitting || !hive}
      destroyOnHidden
    >
      <Form<CopyFormValues> form={form} layout="vertical">
        <Form.Item
          name="new_conference_name"
          label="Name"
          validateFirst
          rules={[nameRequiredRule, nameFormatRule, noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter new conference name" aria-label="New conference name" />
        </Form.Item>

        <Form.Item
          name="new_conference_extension"
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

export default CopyConferenceModal
