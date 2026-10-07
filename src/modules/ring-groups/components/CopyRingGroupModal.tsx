import { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import ErrorState from '../../../components/feedback/ErrorState'
import { extensionReuseNote } from '../ring-group.constants'
import { describeExtensionRange, extensionRules, nameRules } from '../ring-group.validation'
import type { RingGroup, RingGroupHiveDetails } from '../ring-group.types'

interface CopyFormValues {
  new_ring_group_name: string
  new_ring_group_extension: string
}

export interface CopyRingGroupValues {
  name: string
  extension: string
}

interface CopyRingGroupModalProps {
  open: boolean
  target: RingGroup | null
  /** Hive bootstrap for the SOURCE record's own domain (autoExt + range) — null while loading. */
  hive: RingGroupHiveDetails | null
  hiveError: boolean
  onRetryHive: () => void
  submitting: boolean
  onSubmit: (values: CopyRingGroupValues) => void
  onCancel: () => void
}

/**
 * Row Copy (ring-groups.md §3/§8/§20): New Name + New Extension. The copy stays in the source
 * record's domain, which isn't selectable here. The extension is pre-filled with that domain's
 * `autoExt` once it arrives and uses the same range rules as Add/Edit.
 */
const CopyRingGroupModal = ({ open, target, hive, hiveError, onRetryHive, submitting, onSubmit, onCancel }: CopyRingGroupModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()

  useEffect(() => {
    if (open && target) form.resetFields()
  }, [open, target, form])

  // When the source domain's bootstrap lands: suggest its autoExt, unless the user already typed one.
  useEffect(() => {
    if (!open || !hive || form.isFieldTouched('new_ring_group_extension')) return
    form.setFieldsValue({ new_ring_group_extension: hive.autoExt })
  }, [open, hive, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSubmit({ name: values.new_ring_group_name, extension: values.new_ring_group_extension })
    } catch {
      // Field errors are already shown inline.
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Ring Group ${target.ring_group_name}` : 'Copy Ring Group'}
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
        <Form.Item name="new_ring_group_name" label="Name" validateFirst rules={nameRules}>
          <Input placeholder="Enter new ring group name" aria-label="New ring group name" />
        </Form.Item>
        <Form.Item
          name="new_ring_group_extension"
          label="Extension"
          tooltip={hive ? `Must be ${describeExtensionRange(hive)}` : undefined}
          extra={extensionReuseNote}
          validateFirst
          rules={hive ? extensionRules(hive) : [{ required: true, message: 'Extension required in number' }]}
        >
          <Input placeholder={hive ? 'Enter extension' : 'Loading…'} disabled={!hive || submitting} aria-label="New extension" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyRingGroupModal
