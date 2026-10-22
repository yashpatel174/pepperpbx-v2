import { useEffect, useState } from 'react'
import { Alert, App, Form, Input, Modal, Skeleton } from 'antd'
import { getGreeting, updateGreeting } from '../voicemail.service'
import { greetingNameRule } from '../voicemail.constants'
import { noEdgeWhitespaceRule } from '../voicemail.validation'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { GreetingEditValues, VoicemailGreetingDetails } from '../voicemail.types'

interface EditGreetingModalProps {
  /** The greeting being edited, or null when closed. Details are fetched on open (viewGreetings). */
  greetingUuid: string | null
  /** Name is editable only with edit permission (voicemail.md §19). */
  canEdit: boolean
  onSaved: () => void | Promise<void>
  onClose: () => void
}

interface EditFormProps extends Omit<EditGreetingModalProps, 'greetingUuid'> {
  greetingUuid: string
}

/** Mounted only while open, so each open fetches fresh details. */
const EditGreetingForm = ({ greetingUuid, canEdit, onSaved, onClose }: EditFormProps) => {
  const [form] = Form.useForm<GreetingEditValues>()
  const { message } = App.useApp()
  const [details, setDetails] = useState<VoicemailGreetingDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getGreeting(greetingUuid)
      .then((loaded) => {
        if (!active) return
        setDetails(loaded)
        form.setFieldsValue({ greeting_name: loaded.greeting_name, greeting_description: loaded.greeting_description?.trim() })
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Failed to load this greeting.'))
      })
    return () => {
      active = false
    }
  }, [greetingUuid, form])

  const handleSave = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (!details) return
        setSaving(true)
        try {
          await updateGreeting(details, values)
          message.success('Greeting updated successfully.')
          await onSaved()
          onClose()
        } catch (err) {
          message.error(getApiErrorMessage(err, 'Failed to update greeting.'))
        } finally {
          setSaving(false)
        }
      })
      .catch(() => undefined)
  }

  return (
    <Modal
      open
      title="Edit Greeting"
      okText="Save"
      cancelText="Close"
      onOk={handleSave}
      onCancel={saving ? undefined : onClose}
      okButtonProps={{ disabled: !canEdit || !details }}
      confirmLoading={saving}
      width={480}
    >
      {error ? (
        <Alert type="error" showIcon title={error} />
      ) : !details ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <Form<GreetingEditValues> form={form} layout="vertical" disabled={saving}>
          <Form.Item
            name="greeting_name"
            label="Name"
            validateFirst
            required
            rules={[
              { required: true, message: 'Greeting name is required' },
              noEdgeWhitespaceRule,
              { pattern: greetingNameRule, message: 'The Greeting Name can only contain letters, numbers, dashes (-), and underscores (_).' },
            ]}
          >
            <Input placeholder="Enter greeting name" disabled={!canEdit} aria-label="Greeting name" />
          </Form.Item>
          {/* Description is always disabled in Axion (voicemail.md §23b). */}
          <Form.Item name="greeting_description" label="Description" rules={[noEdgeWhitespaceRule]}>
            <Input placeholder="Enter description" disabled aria-label="Greeting description" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}

const EditGreetingModal = ({ greetingUuid, ...rest }: EditGreetingModalProps) =>
  greetingUuid ? <EditGreetingForm key={greetingUuid} greetingUuid={greetingUuid} {...rest} /> : null

export default EditGreetingModal
