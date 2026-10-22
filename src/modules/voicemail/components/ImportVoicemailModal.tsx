import { useState } from 'react'
import { Alert, App, Button, Form, Input, Modal, Select, Typography, Upload, theme } from 'antd'
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { csvFileNameRule, delimiterOptions, enclosureOptions, fromRowOptions, maximumCsvFileSizeBytes } from '../voicemail.constants'
import type { ImportDelimiter, ImportEnclosure, ImportVoicemailOptions } from '../voicemail.types'

const { Dragger } = Upload
const { Text } = Typography

interface ImportVoicemailModalProps {
  open: boolean
  submitting: boolean
  onSubmit: (options: ImportVoicemailOptions) => void | Promise<void>
  onCancel: () => void
}

interface ImportFormValues {
  from_row: string
  delimiter: ImportDelimiter
  enclosure: ImportEnclosure
  csv_raw_data?: string
}

const CSV_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel']

/** File checks from voicemail.md §11 (importVoicemailFormSchema). */
const validateFile = (file: File): string | null => {
  if (!(CSV_MIME_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.csv'))) return 'Only CSV files are allowed'
  if (file.size > maximumCsvFileSizeBytes) return 'File should be less than 10MB'
  if (!csvFileNameRule.test(file.name.replace(/\.csv$/i, ''))) {
    return 'The File name can only contain letters, numbers, dashes (-), and underscores (_).'
  }
  return null
}

/**
 * Import popup, step one of two (voicemail.md §16): From Row / Delimiter / Enclosure, pasted CSV
 * data and/or a CSV file (one of the two is required), plus the Sample CSV download.
 */
const ImportVoicemailModal = ({ open, submitting, onSubmit, onCancel }: ImportVoicemailModalProps) => {
  const [form] = Form.useForm<ImportFormValues>()
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const handleDownloadSampleFile = () => {
    const link = document.createElement('a')
    link.href = '/assets/csv/voicemail_sample.csv'
    link.download = 'voicemail_sample.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOk = () => {
    const uploaded = fileList[0]?.originFileObj as File | undefined

    form
      .validateFields()
      .then((values) => {
        const rawData = values.csv_raw_data?.trim() ?? ''

        if (!uploaded && !rawData) {
          setFileError('Either CSV raw data or a file is required')
          return
        }

        if (uploaded) {
          const error = validateFile(uploaded)
          if (error) {
            setFileError(error)
            return
          }
        }

        return onSubmit({
          fromRow: Number(values.from_row),
          delimiter: values.delimiter,
          enclosure: values.enclosure,
          rawData: rawData || undefined,
          file: uploaded,
        })
      })
      .catch(() => message.error('Please fix the highlighted fields.'))
  }

  const handleCancel = () => {
    form.resetFields()
    setFileList([])
    setFileError(null)
    onCancel()
  }

  return (
    <Modal
      open={open}
      title="Import Voicemail"
      onCancel={submitting ? undefined : handleCancel}
      onOk={handleOk}
      okText="Import"
      confirmLoading={submitting}
      destroyOnHidden
      width={560}
    >
      <Form<ImportFormValues> form={form} layout="vertical" initialValues={{ from_row: '2', delimiter: ',', enclosure: '"' }}>
        <Form.Item name="from_row" label="From Row" tooltip="Start importing the data from this row">
          <Select options={fromRowOptions} showSearch optionFilterProp="label" aria-label="From row" />
        </Form.Item>

        <Form.Item name="delimiter" label="Delimiter" tooltip="Select the delimiter (comma or pipe)" rules={[{ required: true, message: 'Delimiter is required' }]}>
          <Select options={delimiterOptions} aria-label="Delimiter" />
        </Form.Item>

        <Form.Item
          name="enclosure"
          label="Enclosure"
          tooltip="Select the enclosure of text (double-quotes or nothing)"
          rules={[{ required: true, message: 'Enclosure is required' }]}
        >
          <Select options={enclosureOptions} aria-label="Enclosure" />
        </Form.Item>

        <Form.Item
          name="csv_raw_data"
          label="Data"
          tooltip="Copy and paste the comma delimited data into the text area to begin the import"
        >
          <Input.TextArea rows={4} placeholder="Enter data" onChange={() => setFileError(null)} />
        </Form.Item>

        <Form.Item label="Import File">
          <Dragger
            multiple={false}
            maxCount={1}
            accept=".csv,text/csv"
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
            <p className="ant-upload-text">Click or drag a CSV file to this area</p>
          </Dragger>

          {fileError && <Alert type="error" showIcon title={fileError} style={{ marginTop: 8 }} />}
        </Form.Item>

        <Form.Item label="Download Sample">
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadSampleFile}>
            Sample CSV File
          </Button>
        </Form.Item>

        <Text style={{ color: token.colorError }}>
          Upload a CSV with all required inputs. Ensure there is no duplicate or inappropriate data, as such records will not be imported. For
          better results, use the provided Sample CSV.
        </Text>
      </Form>
    </Modal>
  )
}

export default ImportVoicemailModal
