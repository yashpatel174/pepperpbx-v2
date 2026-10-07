import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  extension: string
}

interface DeleteExtensionsModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: (withVoicemail: boolean) => void | Promise<void>
  onCancel: () => void
}

/**
 * Axion-style Delete Extension modal: a direct-action confirmation, not a select-then-confirm
 * flow. "Extension & Voicemail" and "Extension Only" are each the confirmation themselves —
 * there is no separate "choose an option" step before them.
 */
const DeleteExtensionsModal = ({ open, targets, onConfirm, onCancel }: DeleteExtensionsModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<boolean | null>(null)

  const single = targets.length === 1

  const handleConfirm = async (withVoicemail: boolean) => {
    setDeleting(true)
    setPendingChoice(withVoicemail)
    try {
      await onConfirm(withVoicemail)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed.'))
    } finally {
      setDeleting(false)
      setPendingChoice(null)
    }
  }

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button disabled={deleting} onClick={onCancel}>Cancel</Button>
      <Button
        danger
        loading={deleting && pendingChoice === true}
        disabled={deleting && pendingChoice === false}
        onClick={() => handleConfirm(true)}
      >
        Extension & Voicemail
      </Button>
      <Button
        loading={deleting && pendingChoice === false}
        disabled={deleting && pendingChoice === true}
        onClick={() => handleConfirm(false)}
      >
        Extension Only
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      title="Delete Extension"
      onCancel={deleting ? undefined : onCancel}
      footer={footer}
      width={480}
    >
      <Paragraph>
        Are you sure you want to delete {single ? 'this extension' : `these ${targets.length} extensions`}?
      </Paragraph>
      {!single && (
        <ul style={{ paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
          {targets.map(target => (
            <li key={target.id}><Text>{target.extension}</Text></li>
          ))}
        </ul>
      )}
      <Alert
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
        title="Note: Please ensure that this extension is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </Modal>
  )
}

export default DeleteExtensionsModal
