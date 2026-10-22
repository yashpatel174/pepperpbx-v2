import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

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
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Announcements"
      confirmText="Toggle"
      width={440}
      errorMessage="Toggle failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Do you really want to toggle {count === 1 ? 'this announcement' : `these ${count} announcements`}?
      </Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleAnnouncementsModal
