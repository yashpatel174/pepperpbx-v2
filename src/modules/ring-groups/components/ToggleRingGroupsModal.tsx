import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

interface ToggleRingGroupsModalProps {
  open: boolean
  count: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation (ring-groups.md §3/§20) — "Do you really want to toggle this ring
 * group?". Each selected ring group's Enabled flag flips. Stays open on failure, and shows the
 * in-flight state Axion's never did (§28).
 */
const ToggleRingGroupsModal = ({ open, count, onConfirm, onCancel }: ToggleRingGroupsModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Ring Group"
      confirmText="Toggle"
      width={440}
      errorMessage="Failed to toggle ring groups."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Typography.Paragraph>
        Do you really want to toggle {count === 1 ? 'this ring group' : `these ${count} ring groups`}?
      </Typography.Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleRingGroupsModal
