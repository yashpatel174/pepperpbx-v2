import { useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import ErrorState from '../../../components/feedback/ErrorState'
import { extensionReuseNote, toFeatureCode } from '../call-flows.constants'
import { describeExtensionRange, extensionRules, featureCodeRules, nameRules } from '../call-flows.validation'
import type { CallFlow, CallFlowHiveDetails } from '../call-flows.types'

interface CopyFormValues {
  new_call_flow_name: string
  new_call_flow_extension: string
  new_call_flow_feature_code: string
}

export interface CopyCallFlowValues {
  name: string
  extension: string
  featureCode: string
}

interface CopyCallFlowModalProps {
  open: boolean
  target: CallFlow | null
  /** Hive bootstrap for the SOURCE record's own domain (autoExt + range) — null while loading. */
  hive: CallFlowHiveDetails | null
  hiveError: boolean
  onRetryHive: () => void
  submitting: boolean
  onSubmit: (values: CopyCallFlowValues) => void
  onCancel: () => void
}

/**
 * Row Copy (call-flows.md §3/§8/§20): New Name, Extension and Feature Code. The copy stays in the
 * source record's domain, which isn't selectable here.
 *
 * Fixes Axion's broken prefill (§28), where all three fields opened empty: the name is seeded from
 * the source's `call_flow_name`, the extension from the source domain's `autoExt` once it arrives
 * (without a later reset wiping it), and the feature code is generated from the extension exactly
 * as in the Add/Edit form. The extension uses the same range rules as Add/Edit.
 */
const CopyCallFlowModal = ({ open, target, hive, hiveError, onRetryHive, submitting, onSubmit, onCancel }: CopyCallFlowModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()

  // On open: start clean and seed the name from the source record.
  useEffect(() => {
    if (!open || !target) return
    form.resetFields()
    form.setFieldsValue({ new_call_flow_name: target.call_flow_name })
  }, [open, target, form])

  // When the source domain's bootstrap lands: suggest its autoExt, unless the user already typed one.
  useEffect(() => {
    if (!open || !hive || form.isFieldTouched('new_call_flow_extension')) return
    form.setFieldsValue({
      new_call_flow_extension: hive.autoExt,
      new_call_flow_feature_code: toFeatureCode(hive.autoExt),
    })
  }, [open, hive, form])

  const handleValuesChange = (changed: Partial<CopyFormValues>) => {
    if ('new_call_flow_extension' in changed) {
      form.setFieldsValue({ new_call_flow_feature_code: toFeatureCode(changed.new_call_flow_extension) })
    }
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSubmit({
        name: values.new_call_flow_name,
        extension: values.new_call_flow_extension,
        featureCode: values.new_call_flow_feature_code,
      })
    } catch {
      // Field errors are already shown inline.
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Call Flow ${target.call_flow_name}` : 'Copy Call Flow'}
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
      <Form<CopyFormValues> form={form} layout="vertical" disabled={submitting} onValuesChange={handleValuesChange}>
        <Form.Item name="new_call_flow_name" label="Name" validateFirst rules={nameRules}>
          <Input placeholder="Enter new call flow name" aria-label="New call flow name" />
        </Form.Item>
        <Form.Item
          name="new_call_flow_extension"
          label="Extension"
          tooltip={hive ? `Must be ${describeExtensionRange(hive)}` : undefined}
          extra={extensionReuseNote}
          validateFirst
          rules={hive ? extensionRules(hive) : [{ required: true, message: 'Extension required in number' }]}
        >
          <Input placeholder={hive ? 'Enter extension' : 'Loading…'} disabled={!hive || submitting} aria-label="New extension" />
        </Form.Item>
        <Form.Item
          name="new_call_flow_feature_code"
          label="Feature Code"
          tooltip="Generated from the extension"
          rules={featureCodeRules}
        >
          <Input readOnly placeholder="Generated from the extension" aria-label="New feature code" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyCallFlowModal
