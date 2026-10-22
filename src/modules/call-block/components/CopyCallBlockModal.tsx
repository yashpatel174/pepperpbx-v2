import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import type { CallBlock } from '../call-block.types'

const { Paragraph } = Typography

interface CopyCallBlockModalProps {
  open: boolean
  target: CallBlock | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Confirmation-only Copy — matches the audit exactly ("Do you really want to copy this call
 * block?", call-block.md §3/§8/§20: no inline form for new name/extension, unlike Fax Servers).
 * The backend determines the domain/duplication behavior — nothing to fill in here on purpose.
 */
const CopyCallBlockModal = ({ open, target, onConfirm, onCancel }: CopyCallBlockModalProps) => {
  const label = target?.call_block_name ?? target?.call_block_number ?? 'this call block'

  return (
    <ConfirmActionModal
      open={open}
      title="Copy Call Block"
      confirmText="Copy"
      width={440}
      errorMessage="Copy failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>Do you really want to copy {target ? `call block "${label}"` : 'this call block'}?</Paragraph>
    </ConfirmActionModal>
  )
}

export default CopyCallBlockModal
