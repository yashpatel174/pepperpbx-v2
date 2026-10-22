import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

interface ToggleConferenceControlsModalProps {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation only (conference-controls.md §3/§20) — the inline Status click toggles
 * without a popup. The Toggle button shows a loading state, and the modal stays open if the request
 * fails so the user can retry or cancel.
 */
const ToggleConferenceControlsModal = ({ open, onConfirm, onCancel }: ToggleConferenceControlsModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Conference Controls"
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

export default ToggleConferenceControlsModal
