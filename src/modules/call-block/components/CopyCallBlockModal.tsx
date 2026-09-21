import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'
import type { CallBlock } from '../call-block.types'

const { Paragraph } = Typography

interface CopyCallBlockModalProps {
  open: boolean
  target: CallBlock | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Confirmation-only Copy — matches the audit exactly ("Do you really want to copy this call
 * block?", call-block.md §3/§8/§20: no inline form for new name/extension, unlike Fax Servers).
 * The backend determines the domain/duplication behavior — nothing to fill in here on purpose.
 */
const CopyCallBlockModal = ({ open, target, onConfirm, onCancel }: CopyCallBlockModalProps) => {
  const { message } = App.useApp()
  const [copying, setCopying] = useState(false)

  const handleConfirm = async () => {
    setCopying(true)
    try {
      await onConfirm()
    } catch {
      message.error('Copy failed.')
    } finally {
      setCopying(false)
    }
  }

  const label = target?.call_block_name ?? target?.call_block_number ?? 'this call block'

  return (
    <Modal
      open={open}
      title="Copy Call Block"
      onCancel={copying ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={copying} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={copying} onClick={handleConfirm}>
            Copy
          </Button>
        </div>
      }
      width={440}
    >
      <Paragraph>Do you really want to copy {target ? `call block "${label}"` : 'this call block'}?</Paragraph>
    </Modal>
  )
}

export default CopyCallBlockModal
