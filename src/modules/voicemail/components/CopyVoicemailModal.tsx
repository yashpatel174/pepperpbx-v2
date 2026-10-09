import { useEffect } from 'react'
import { App, Form, Input, Modal, Typography } from 'antd'
import ErrorState from '../../../components/feedback/ErrorState'
import { extensionReuseNote } from '../../../components/common/extensionReuseNote'
import { voicemailIdRules } from '../voicemail.validation'
import type { HiveVoicemailDetails, Voicemail } from '../voicemail.types'

const { Paragraph } = Typography

interface CopyVoicemailModalProps {
  open: boolean
  target: Voicemail | null
  /** Hive bootstrap for the target's own domain (autoExt + range + reserved list). Null while
   * still loading, or when that fetch failed (`hiveError`). */
  hive: HiveVoicemailDetails | null
  hiveError: boolean
  onRetryHive: () => void
  submitting: boolean
  onSubmit: (newVoicemailId: string) => void | Promise<void>
  onCancel: () => void
}

interface CopyFormValues {
  new_voicemail_id: string
}

/**
 * Copy popup (voicemail.md §15): a single required Voicemail ID, prefilled with the source
 * domain's `autoExt`, validated with the same three rules as the form's Voicemail ID. Everything
 * else that gets copied is decided by the backend.
 */
const CopyVoicemailModal = ({ open, target, hive, hiveError, onRetryHive, submitting, onSubmit, onCancel }: CopyVoicemailModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()
  const { message } = App.useApp()

  useEffect(() => {
    if (open) form.setFieldsValue({ new_voicemail_id: hive?.autoExt ?? '' })
    else form.resetFields()
  }, [open, hive, form])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => onSubmit(values.new_voicemail_id))
      .catch(() => message.error('Please fix the highlighted fields.'))
  }

  return (
    <Modal
      open={open}
      title="Copy Voicemail"
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      confirmLoading={submitting || (!hive && !hiveError)}
      okButtonProps={{ disabled: hiveError || !hive }}
      destroyOnHidden
      width={440}
    >
      {hiveError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorState message="Failed to load domain details for copy." onRetry={onRetryHive} />
        </div>
      )}
      <Paragraph>Do you really want to copy {target ? `voicemail ${target.voicemail_id}` : 'this voicemail'}?</Paragraph>
      <Form<CopyFormValues> form={form} layout="vertical">
        <Form.Item
          name="new_voicemail_id"
          label="Voicemail ID"
          validateFirst
          extra={extensionReuseNote}
          rules={hive ? voicemailIdRules(hive) : [{ required: true, message: 'Voicemail ID required in number' }]}
        >
          <Input placeholder="Enter Voicemail id" aria-label="New voicemail ID" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyVoicemailModal
