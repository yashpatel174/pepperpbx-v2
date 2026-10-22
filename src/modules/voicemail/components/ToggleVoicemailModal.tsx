import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph } = Typography

interface ToggleVoicemailModalProps {
  open: boolean
  count: number
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Bulk-only confirmation (voicemail.md §5): title "Toggle Voicemail", "Do you really want to
 * toggle this?". The inline Status button toggles immediately, without this modal (§7).
 */
const ToggleVoicemailModal = ({ open, count, onConfirm, onCancel }: ToggleVoicemailModalProps) => (
  <ConfirmActionModal
    open={open}
    title="Toggle Voicemail"
    confirmText="Toggle"
    width={440}
    errorMessage="Toggle failed."
    onConfirm={onConfirm}
    onCancel={onCancel}
  >
    <Paragraph>Do you really want to toggle {count === 1 ? 'this voicemail' : `these ${count} voicemails`}?</Paragraph>
  </ConfirmActionModal>
)

export default ToggleVoicemailModal
