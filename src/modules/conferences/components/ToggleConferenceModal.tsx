import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'

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
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch {
      message.error('Toggle failed.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Conferences"
      onCancel={toggling ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={toggling} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={toggling} onClick={handleConfirm}>
            Toggle
          </Button>
        </div>
      }
      width={440}
    >
      <Paragraph>Do you really want to toggle the status of {count === 1 ? 'this conference' : `these ${count} conferences`}?</Paragraph>
    </Modal>
  )
}

export default ToggleConferenceModal
