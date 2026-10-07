import { Typography } from 'antd'
import ConfirmActionModal from '../../../../components/common/ConfirmActionModal'
import type { OutboundRoute } from '../outbound-route.types'

const { Paragraph } = Typography

interface CopyOutboundRouteModalProps {
  open: boolean
  target: OutboundRoute | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Confirmation-only Copy — matches the audit exactly ("Do you really want to copy this outbound
 * routes?", outbound-routes.md §3/§20/§24), unlike Destinations' Copy (which collects a new
 * destination number via an inline form). No fields to fill in here on purpose.
 */
const CopyOutboundRouteModal = ({ open, target, onConfirm, onCancel }: CopyOutboundRouteModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Copy Outbound Route"
      confirmText="Copy"
      width={440}
      errorMessage="Copy failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>Do you really want to copy {target ? `outbound route "${target.name}"` : 'this outbound route'}?</Paragraph>
    </ConfirmActionModal>
  )
}

export default CopyOutboundRouteModal
