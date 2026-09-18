import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'

const { Paragraph } = Typography

interface ToggleOutboundRoutesModalProps {
  open: boolean
  count: number
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Bulk-only confirmation — the audit documents no per-row popup for the Status pill (it toggles
 * inline, no confirmation, see outbound-route.service.ts's toggleOutboundRoutes and
 * OutboundRouteTable.tsx); this modal backs only the "Toggle" bulk action
 * (outbound-routes.md §3/§20/§21/§26's "Do you really want to toggle this?").
 */
const ToggleOutboundRoutesModal = ({ open, count, onConfirm, onCancel }: ToggleOutboundRoutesModalProps) => {
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch {
      message.error('Toggle failed.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Outbound Routes"
      onCancel={toggling ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={toggling} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={toggling} onClick={handleConfirm}>
            Toggle
          </Button>
        </div>
      }
      width={440}
    >
      <Paragraph>
        Do you really want to toggle the status of {count === 1 ? 'this outbound route' : `these ${count} outbound routes`}?
      </Paragraph>
    </Modal>
  )
}

export default ToggleOutboundRoutesModal
