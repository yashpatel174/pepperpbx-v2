import { useEffect } from 'react'
import { Form, Input, Modal, Typography } from 'antd'
import { nameRules } from '../time-group-preset.validation'
import type { TimeGroupPreset } from '../time-group-preset.types'

interface CopyFormValues {
  new_name: string
}

interface CopyTimeGroupPresetModalProps {
  open: boolean
  target: TimeGroupPreset | null
  submitting: boolean
  onSubmit: (name: string) => void
  onCancel: () => void
}

/**
 * Row Copy (Axion's `CopyPreset`): "Do you really want to copy this?" + a new Name, validated by
 * `copyPresetFormSchema` (same rules as the form's Name). Axion's Extension field is commented out
 * and not ported. The copy stays in the source preset's domain.
 */
const CopyTimeGroupPresetModal = ({ open, target, submitting, onSubmit, onCancel }: CopyTimeGroupPresetModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()

  useEffect(() => {
    if (open && target) form.resetFields()
  }, [open, target, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSubmit(values.new_name)
    } catch {
      // Field errors are already shown inline.
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Preset ${target.name}` : 'Copy Preset'}
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      confirmLoading={submitting}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnHidden
    >
      <Typography.Paragraph>Do you really want to copy this?</Typography.Paragraph>
      <Form<CopyFormValues> form={form} layout="vertical" disabled={submitting}>
        <Form.Item name="new_name" label="Name" tooltip="Enter the preset name." validateFirst rules={nameRules}>
          <Input placeholder="Enter name" aria-label="New preset name" onPressEnter={handleOk} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyTimeGroupPresetModal
