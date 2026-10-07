import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph } = Typography

interface ToggleCallBlockModalProps {
  open: boolean
  count: number
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Bulk-only confirmation — the audit documents no per-row popup for the Status pill (it toggles
 * inline, no confirmation, see call-block.service.ts's toggleCallBlocks and CallBlockTable.tsx);
 * this modal backs only the "Toggle" bulk action (call-block.md §3/§20/§21's "Do you really want
 * to toggle this call block?").
 */
const ToggleCallBlockModal = ({ open, count, onConfirm, onCancel }: ToggleCallBlockModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Call Blocks"
      confirmText="Toggle"
      width={440}
      errorMessage="Toggle failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>Do you really want to toggle {count === 1 ? 'this call block' : `these ${count} call blocks`}?</Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleCallBlockModal
