import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

interface ToggleIVRMenuModalProps {
  open: boolean
  count: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation (ivr-menus.md §3/§20) — Axion's "Do you really want to toggle this IVR
 * Menu?". Each selected menu flips to the opposite state. Only the bulk path confirms; the inline
 * Status pill toggles immediately. Stays open on failure.
 */
const ToggleIVRMenuModal = ({ open, count, onConfirm, onCancel }: ToggleIVRMenuModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle IVR Menu"
      confirmText="Toggle"
      width={440}
      errorMessage="Failed to toggle IVR menus."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        {count === 1 ? 'Do you really want to toggle this IVR Menu?' : `Do you really want to toggle these ${count} IVR Menus?`}
      </Typography.Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleIVRMenuModal
