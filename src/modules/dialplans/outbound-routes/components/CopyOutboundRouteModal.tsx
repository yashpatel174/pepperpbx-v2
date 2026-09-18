import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'
import type { OutboundRoute } from '../outbound-route.types'

const { Paragraph } = Typography

interface CopyOutboundRouteModalProps {
  open: boolean
  target: OutboundRoute | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Confirmation-only Copy — matches the audit exactly ("Do you really want to copy this outbound
 * routes?", outbound-routes.md §3/§20/§24), unlike Destinations' Copy (which collects a new
 * destination number via an inline form). No fields to fill in here on purpose.
 */
const CopyOutboundRouteModal = ({ open, target, onConfirm, onCancel }: CopyOutboundRouteModalProps) => {
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

  return (
    <Modal
      open={open}
      title="Copy Outbound Route"
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
      <Paragraph>Do you really want to copy {target ? `outbound route "${target.name}"` : 'this outbound route'}?</Paragraph>
    </Modal>
  )
}

export default CopyOutboundRouteModal
