import { useEffect, useState } from 'react'
import { App, Button, Form, Input, Modal } from 'antd'
import { getHiveUserDetails, isExtensionNumberTaken } from '../extension.service'
import { extensionNumberRules } from '../extension.validation'
import type { Extension, HiveUserDetails } from '../extension.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

interface CopyExtensionModalProps {
  open: boolean
  target: Extension | null
  /** Performs the copy; the page closes the modal on success. A rejection keeps it open. */
  onCopy: (newExtension: string) => Promise<void>
  onCancel: () => void
}

interface CopyFormValues {
  new_extension: string
}

/**
 * Copy popup — a one-field inline form (New Extension), not the Add/Edit form, matching
 * extension.md §3/§8/§20. Copies within the source record's own domain (not user-selectable):
 * the extension-range rules and the pre-filled autoExt are fetched for that domain on open.
 * Unlike Axion's CopyModal (whose `saveLoading` is never passed, §28), the Copy button shows a
 * real loading state and blocks repeat submissions while the request runs.
 */
const CopyExtensionModal = ({ open, target, onCopy, onCancel }: CopyExtensionModalProps) => {
  const [form] = Form.useForm<CopyFormValues>()
  const { message } = App.useApp()
  const [hive, setHive] = useState<HiveUserDetails | null>(null)
  const [copying, setCopying] = useState(false)

  const targetDomain = target?.domain

  useEffect(() => {
    if (!open) {
      setHive(null)
      return
    }
    let active = true
    getHiveUserDetails(targetDomain)
      .then((details) => {
        if (!active) return
        setHive(details)
        form.setFieldsValue({ new_extension: details.autoExt })
      })
      .catch(() => {
        if (active) message.error('Failed to load extension settings for this domain.')
      })
    return () => {
      active = false
    }
  }, [open, targetDomain, form, message])

  const handleCopy = async () => {
    if (copying) return
    let values: CopyFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    setCopying(true)
    try {
      await onCopy(values.new_extension)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to copy extension.'))
    } finally {
      setCopying(false)
    }
  }

  return (
    <Modal
      open={open}
      title={target ? `Copy Extension ${target.extension}` : 'Copy Extension'}
      onCancel={copying ? undefined : onCancel}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={copying} onClick={onCancel}>
            Close
          </Button>
          <Button type="primary" loading={copying} disabled={!hive} onClick={handleCopy}>
            Copy
          </Button>
        </div>
      }
      width={440}
    >
      <Form<CopyFormValues> form={form} layout="vertical" onFinish={handleCopy}>
        <Form.Item
          name="new_extension"
          label="Extension"
          tooltip="Pre-filled with the next suggested extension for this domain"
          validateFirst
          // No excludeUuid: the source's own number must count as taken for a copy.
          rules={
            hive
              ? extensionNumberRules({
                  additionalExtStart: hive.additionalExtStart,
                  additionalExtEnd: hive.additionalExtEnd,
                  additionalExtExclude: hive.additionalExtExclude,
                  isTaken: isExtensionNumberTaken,
                })
              : [{ required: true, message: 'Enter extension' }]
          }
        >
          <Input placeholder="Enter extension" aria-label="New extension number" disabled={!hive || copying} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CopyExtensionModal
