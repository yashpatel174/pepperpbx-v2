import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph } = Typography

interface ToggleConferenceModalProps {
  open: boolean
  count: number
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Bulk-only confirmation — the audit documents no popup for the inline row Status Tag (it toggles
 * immediately, no confirmation, conferences.md §3/§25/§28); this modal backs only the "Toggle" bulk
 * action ("Do you really want to toggle this?", conferences.md §3/§20/§21). Includes an explicit
 * `loading` state on the Toggle button — deliberately not reproducing the audit's confirmed bug
 * where `saveLoading` is never passed to `ToggleConferences`, leaving its spinner dead
 * (conferences.md §16/§28/§33).
 */
const ToggleConferenceModal = ({ open, count, onConfirm, onCancel }: ToggleConferenceModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Conferences"
      confirmText="Toggle"
      width={440}
      errorMessage="Toggle failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>Do you really want to toggle the status of {count === 1 ? 'this conference' : `these ${count} conferences`}?</Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleConferenceModal
