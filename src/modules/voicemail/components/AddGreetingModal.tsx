import { useState } from 'react'
import { Alert, Form, Modal, Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { audioFileNameRule, greetingMimeTypes, maximumAudioFileSizeBytes } from '../voicemail.constants'

const { Dragger } = Upload

interface AddGreetingModalProps {
  open: boolean
  submitting: boolean
  onSubmit: (file: File) => void | Promise<void>
  onCancel: () => void
}

/** voicemail.md §11 greeting upload rules, in the audit's order. */
const validateAudioFile = (file: File): string | null => {
  if (!greetingMimeTypes.includes(file.type)) return 'Only MP3, WAV or OGG files are allowed'
  if (file.size > maximumAudioFileSizeBytes) return 'The file size should be a maximum of 80MB.'
  if (!audioFileNameRule.test(file.name.replace(/\.[^.]+$/, ''))) {
    return 'The File name can only contain letters, numbers, dashes (-), and underscores (_).'
  }
  return null
}

/** "Add Greetings" popup (voicemail.md §23b): one required Upload File; Upload / Close. */
const AddGreetingModal = ({ open, submitting, onSubmit, onCancel }: AddGreetingModalProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const reset = () => {
    setFileList([])
    setFileError(null)
  }

  const handleOk = () => {
    const file = fileList[0]?.originFileObj as File | undefined
    if (!file) {
      setFileError('File required')
      return
    }
    const error = validateAudioFile(file)
    if (error) {
      setFileError(error)
      return
    }
    void onSubmit(file)
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <Modal
      open={open}
      title="Add Greetings"
      okText="Upload"
      cancelText="Close"
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={submitting ? undefined : handleCancel}
      afterClose={reset}
      destroyOnHidden
      width={480}
    >
      <Form layout="vertical">
        <Form.Item label="Upload File" required>
          <Dragger
            multiple={false}
            maxCount={1}
            accept=".mp3,.wav,.ogg,audio/mp3,audio/mpeg,audio/wav,audio/ogg"
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: nextList }) => {
              setFileList(nextList.slice(-1))
              setFileError(null)
            }}
            onRemove={() => setFileList([])}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag an MP3, WAV or OGG file to this area</p>
          </Dragger>
          {fileError && <Alert type="error" showIcon title={fileError} style={{ marginTop: 8 }} />}
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddGreetingModal
