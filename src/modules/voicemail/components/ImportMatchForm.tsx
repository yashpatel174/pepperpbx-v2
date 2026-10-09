import { Alert, Card, Col, Form, Input, Row, Select, Typography, theme } from 'antd'
import { requiredImportMatchFields, voicemailCsvFields } from '../voicemail.constants'

const { Text } = Typography

export interface ImportMatchFormValues {
  [dbField: string]: string | undefined
}

interface ImportMatchFormProps {
  formId: string
  matchedFields: Record<string, string>
  unmatchedDbFields: string[]
  csvColumns: string[]
  rowCount: number
  onSubmit: (mapField: Record<string, string>) => void
}

const fieldLabel = (key: string) => voicemailCsvFields.find((entry) => entry.key === key)?.header ?? key

/**
 * Match-resolution step (voicemail.md §16): read-only "Matched" fields plus an "Unmatched" selector
 * per remaining field. `voicemail_id` and `domain_name` are required mappings (§11 importMatchSchema).
 * Voicemail-specific, not a generic import framework.
 */
const ImportMatchForm = ({ formId, matchedFields, unmatchedDbFields, csvColumns, rowCount, onSubmit }: ImportMatchFormProps) => {
  const [form] = Form.useForm<ImportMatchFormValues>()
  const { token } = theme.useToken()
  const matchedEntries = Object.entries(matchedFields)
  // A CSV column already consumed by an auto-matched field is not offered again.
  const availableColumns = csvColumns.filter((column) => !Object.values(matchedFields).includes(column))

  const handleFinish = (values: ImportMatchFormValues) => {
    const unmatched = Object.fromEntries(Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined))
    onSubmit({ ...matchedFields, ...unmatched })
  }

  return (
    <Form<ImportMatchFormValues> id={formId} form={form} layout="vertical" onFinish={handleFinish}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title={`${rowCount} row${rowCount === 1 ? '' : 's'} ready to import once fields are mapped.`}
      />

      {matchedEntries.length > 0 && (
        <Card title="Matched" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {matchedEntries.map(([dbField, csvColumn]) => (
              <Col xs={24} sm={12} lg={8} key={dbField}>
                <Form.Item label={fieldLabel(dbField)} tooltip="This field corresponds to a column in the CSV file">
                  <Input value={csvColumn} disabled aria-label={`${fieldLabel(dbField)} matched column`} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {unmatchedDbFields.length > 0 && (
        <Card title="Unmatched">
          <Text style={{ color: token.colorError, display: 'block', marginBottom: 12 }}>
            Kindly choose a distinct field for each unmatched column in the CSV.
          </Text>
          <Row gutter={16}>
            {unmatchedDbFields.map((dbField) => {
              const required = requiredImportMatchFields.includes(dbField)
              const label = fieldLabel(dbField)
              return (
                <Col xs={24} sm={12} lg={8} key={dbField}>
                  <Form.Item
                    name={dbField}
                    label={label}
                    required={required}
                    rules={
                      required
                        ? [{ required: true, message: dbField === 'domain_name' ? 'Domain Name required' : 'Voicemail ID required in number' }]
                        : undefined
                    }
                  >
                    <Select
                      showSearch
                      allowClear={!required}
                      placeholder="Select column"
                      options={availableColumns.map((column) => ({ label: column, value: column }))}
                      aria-label={`Map ${label}`}
                    />
                  </Form.Item>
                </Col>
              )
            })}
          </Row>
        </Card>
      )}
    </Form>
  )
}

export default ImportMatchForm
