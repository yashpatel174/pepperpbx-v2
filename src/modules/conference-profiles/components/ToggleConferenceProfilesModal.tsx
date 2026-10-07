import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

interface ToggleConferenceProfilesModalProps {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation only (conference-profiles.md §3/§20) — the inline Status click toggles
 * without a popup. Unlike Axion, which closes the popup before the request fires (§20/§28), the
 * modal stays open with a loading Toggle button until the request settles, and stays open on
 * failure so the user can retry or cancel.
 */
const ToggleConferenceProfilesModal = ({ open, onConfirm, onCancel }: ToggleConferenceProfilesModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Conference Profiles"
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

export default ToggleConferenceProfilesModal
