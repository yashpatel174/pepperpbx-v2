import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

interface ToggleConferenceCentersModalProps {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation only — the inline Status click toggles without a popup. The Toggle
 * button shows a real loading state (Axion's `saveLoading` prop here is never passed, so its
 * spinner never renders — conference-centers.md §16/§28).
 */
const ToggleConferenceCentersModal = ({ open, onConfirm, onCancel }: ToggleConferenceCentersModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Conference Centers"
      confirmText="Toggle"
      width={440}
      errorMessage="Toggle failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Typography.Paragraph>Do you really want to toggle this?</Typography.Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleConferenceCentersModal
