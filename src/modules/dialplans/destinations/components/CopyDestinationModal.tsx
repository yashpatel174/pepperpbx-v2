import { useEffect } from 'react'
import { App, Form, Input, Modal } from 'antd'
import { isDestinationNumberTaken } from '../destination.service'
import { destinationNumberRules } from '../destination.validation'
import type { Destination } from '../destination.types'

interface CopyDestinationModalProps {
  open: boolean
  target: Destination | null
  /** Suggested next destination number for the target's domain — mirrors Extensions/Axion's autoExt convention. */
  suggestedNumber: string
  submitting: boolean
  onSubmit: (newDestinationNumber: string) => void | Promise<void>
  onCancel: () => void
}

interface CopyFormValues {
  new_destination_number: string
}

/**
 * Copy popup — a small inline form, not a full page, matching destinations.md §9/§20's Copy
 * modal. Copies within the source record's own domain (not user-selectable) with a new,
 * validated destination number, prefilled with a suggested next number.
 */
const CopyDestinationModal = ({ open, target, suggestedNumber, submitting, onSubmit, onCancel }: CopyDestinationModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()
  const { message } = App.useApp()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ new_destination_number: suggestedNumber })
    } else {
      form.resetFields()
    }
  }, [open, suggestedNumber, form])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => onSubmit(values.new_destination_number))
      .catch(() => message.error('Please fix the highlighted fields.'))
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Destination ${target.destination}` : 'Copy Destination'}
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Copy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form<CopyFormValues> form={form} layout="vertical">
        <Form.Item
          name="new_destination_number"
          label="Destination"
          tooltip="Enter the new destination number"
          validateFirst
          rules={destinationNumberRules(isDestinationNumberTaken)}
        >
          <Input placeholder="Enter new destination number" aria-label="New destination number" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyDestinationModal
