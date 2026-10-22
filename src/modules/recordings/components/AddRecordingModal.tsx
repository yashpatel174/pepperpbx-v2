import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Input, Modal, Select, Skeleton, Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { audioFileNameRule, maximumAudioFileSizeBytes, recordingMimeTypes } from '../recordings.constants'
import { noEdgeWhitespaceRule, recordingNameRules } from '../recordings.validation'
import { getRecordingDomains } from '../recordings.service'
import type { CreateRecordingPayload, RecordingDomainOptions } from '../recordings.types'

const { Dragger } = Upload

interface AddRecordingModalProps {
  open: boolean
  submitting: boolean
  onSubmit: (payload: CreateRecordingPayload) => void | Promise<void>
  onCancel: () => void
}

interface AddRecordingFormValues {
  recording_name: string
  domain_name: string
}

/** recordings.md §10 upload rules, in the audit's order. */
const validateAudioFile = (file: File): string | null => {
  if (!recordingMimeTypes.includes(file.type)) return 'Only MP3, WAV or OGG files are allowed'
  if (file.size > maximumAudioFileSizeBytes) return 'The file size should be a maximum of 80MB.'
  if (!audioFileNameRule.test(file.name.replace(/\.[^.]+$/, ''))) {
    return 'The File name can only contain letters, numbers, dashes (-), and underscores (_).'
  }
  return null
}

/** Mounted only while open, so each open re-fetches the domain options and starts from a clean form. */
const AddRecordingForm = ({ submitting, onSubmit, onCancel }: Omit<AddRecordingModalProps, 'open'>) => {
  const [form] = Form.useForm<AddRecordingFormValues>()
  const [domains, setDomains] = useState<RecordingDomainOptions | null>(null)
  const [domainsError, setDomainsError] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  // Request generation: only the latest request may update state, so an older response never
  // overwrites a newer retry. Bumped again on unmount (the modal closing) to drop a pending one.
  const domainsRequestRef = useRef(0)

  // The Form mounts only once `domains` is set, and seeds the Domain field from `initialValues`.
  const loadDomains = useCallback(() => {
    const requestId = ++domainsRequestRef.current
    setDomains(null)
    setDomainsError(false)
    getRecordingDomains()
      .then((loaded) => {
        if (requestId === domainsRequestRef.current) setDomains(loaded)
      })
      .catch(() => {
        if (requestId === domainsRequestRef.current) setDomainsError(true)
      })
  }, [])

  useEffect(() => {
    loadDomains()
    const requestRef = domainsRequestRef
    return () => {
      requestRef.current += 1
    }
  }, [loadDomains])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
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
        void onSubmit({ recording_name: values.recording_name.trim(), domain_name: values.domain_name, file })
      })
      .catch(() => {
        // Field errors are rendered inline; surface a missing/invalid file at the same time.
        if (!fileList[0]) setFileError('File required')
      })
  }

  return (
    <Modal
      open
      title="Add Recording"
      okText="Upload"
      cancelText="Close"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !domains }}
      onOk={handleOk}
      onCancel={submitting ? undefined : onCancel}
      maskClosable={false}
      width={520}
    >
      {domainsError ? (
        <Alert
          type="error"
          showIcon
          title="Failed to load the domain options."
          action={
            <Button size="small" onClick={loadDomains}>
              Retry
            </Button>
          }
        />
      ) : !domains ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Form<AddRecordingFormValues> form={form} layout="vertical" disabled={submitting} initialValues={{ domain_name: domains.defaultDomain }}>
          <Form.Item name="recording_name" label="Recording Name" validateFirst required rules={recordingNameRules}>
            <Input placeholder="Enter recording name" aria-label="Recording name" />
          </Form.Item>
          <Form.Item
            name="domain_name"
            label="Domain"
            required
            rules={[{ required: true, message: 'Domain name is required.' }, noEdgeWhitespaceRule]}
          >
            <Select
              showSearch
              placeholder="Select domain"
              options={domains.domainOptions.map((name) => ({ label: name, value: name }))}
              aria-label="Domain"
            />
          </Form.Item>
          <Form.Item label="Upload File" required>
            <Dragger
              multiple={false}
              maxCount={1}
              disabled={submitting}
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
      )}
    </Modal>
  )
}

/** Add Recording popup (recordings.md §3/§20) — a modal from the list toolbar, not a route. */
const AddRecordingModal = ({ open, ...rest }: AddRecordingModalProps) => (open ? <AddRecordingForm {...rest} /> : null)

export default AddRecordingModal
