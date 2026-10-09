import { useState } from 'react'
import { Button, Descriptions, Modal, Typography } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
import type { ImportInfo } from '../voicemail.types'

const { Paragraph } = Typography

interface ImportInfoModalProps {
  info: ImportInfo | null
  onClose: () => void
}

/**
 * Import result summary shown on the list after the match step (voicemail.md §16): Voicemail
 * Added / Invalid Voicemail counts and the Duplicate Voicemail JSON with a copy-to-clipboard button.
 * Module-local until a second module needs it.
 */
const ImportInfoModal = ({ info, onClose }: ImportInfoModalProps) => {
  const [copied, setCopied] = useState(false)
  const duplicateJson = JSON.stringify(info?.duplicate_data ?? [], null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(duplicateJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal
      open={!!info}
      title="Import Information"
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Close
        </Button>
      }
      destroyOnHidden
      width={520}
    >
      <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Voicemail Added: Count">{info?.add_count ?? 0}</Descriptions.Item>
        <Descriptions.Item label="Invalid Voicemail: Count">{info?.invalid_count ?? 0}</Descriptions.Item>
      </Descriptions>

      <Typography.Text strong>Duplicate Voicemail</Typography.Text>
      <Button
        size="small"
        style={{ marginLeft: 8 }}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={handleCopy}
        aria-label="Copy duplicate voicemail data"
      >
        {copied ? 'Text Copied!' : 'Copy'}
      </Button>
      <Paragraph>
        <pre style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>{duplicateJson}</pre>
      </Paragraph>
    </Modal>
  )
}

export default ImportInfoModal
