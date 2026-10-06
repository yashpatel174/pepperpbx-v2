import { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import { nameRules } from '../time-group.validation'
import type { TimeGroup } from '../time-group.types'

interface CopyFormValues {
  new_name: string
}

interface CopyTimeGroupModalProps {
  open: boolean
  target: TimeGroup | null
  submitting: boolean
  onSubmit: (name: string) => void
  onCancel: () => void
}

/**
 * Row Copy (time-groups.md §3 Copy/§8/§20): New Name only, with the same rules as the form's Name.
 * Axion's New Extension field is commented out there (§28) and not ported. The copy stays in the
 * source record's domain.
 */
const CopyTimeGroupModal = ({ open, target, submitting, onSubmit, onCancel }: CopyTimeGroupModalProps) => {
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
      title={target ? `Copy Time Group ${target.dialplan_name}` : 'Copy Time Group'}
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      confirmLoading={submitting}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnHidden
    >
      <Form<CopyFormValues> form={form} layout="vertical" disabled={submitting}>
        <Form.Item name="new_name" label="Name" validateFirst rules={nameRules}>
          <Input placeholder="Enter new time group name" aria-label="New time group name" onPressEnter={handleOk} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyTimeGroupModal
