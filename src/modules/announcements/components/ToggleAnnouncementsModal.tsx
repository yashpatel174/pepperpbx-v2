import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'

const { Paragraph } = Typography

interface ToggleAnnouncementsModalProps {
  open: boolean
  count: number
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Bulk-only confirmation — the audit documents no per-row popup for the Status pill (it toggles
 * inline, no confirmation, see announcement.service.ts's toggleAnnouncements and
 * AnnouncementTable.tsx); this modal backs only the "Toggle" bulk action (announcements.md
 * §3/§20/§21's "Do you really want to toggle this announcement?").
 */
const ToggleAnnouncementsModal = ({ open, count, onConfirm, onCancel }: ToggleAnnouncementsModalProps) => {
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
      title="Toggle Announcements"
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
        Do you really want to toggle {count === 1 ? 'this announcement' : `these ${count} announcements`}?
      </Paragraph>
    </Modal>
  )
}

export default ToggleAnnouncementsModal
