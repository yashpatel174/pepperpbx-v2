import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'

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
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Toggle failed.'))
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Conference Profiles"
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
      <Typography.Paragraph>Do you really want to toggle this?</Typography.Paragraph>
    </Modal>
  )
}

export default ToggleConferenceProfilesModal
