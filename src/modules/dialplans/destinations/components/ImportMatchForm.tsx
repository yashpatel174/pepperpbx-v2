import { Alert, Card, Col, Form, Input, Row, Select, Typography } from 'antd'
import { requiredImportMatchFields } from '../destination.constants'

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

/**
 * Match-resolution UI — read-only "Matched" fields plus per-field "Unmatched" column selectors,
 * matching destinations.md §8/§25's ImportMatchForm. destination_type and destination_number are
 * required mappings (requiredImportMatchFields) — every other unmatched DB field is optional.
 * Kept Destinations-specific, not a generic import framework.
 */
const ImportMatchForm = ({ formId, matchedFields, unmatchedDbFields, csvColumns, rowCount, onSubmit }: ImportMatchFormProps) => {
  const [form] = Form.useForm<ImportMatchFormValues>()
  const matchedEntries = Object.entries(matchedFields)
  // A CSV column already consumed by an auto-matched field shouldn't also be offered for a
  // different unmatched DB field — each field maps to a distinct column.
  const availableColumns = csvColumns.filter((column) => !Object.values(matchedFields).includes(column))

  const handleFinish = (values: ImportMatchFormValues) => {
    const mapField = Object.fromEntries(
      Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined)
    )
    onSubmit(mapField)
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
        <Card title="Matched Fields" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {matchedEntries.map(([dbField, csvColumn]) => (
              <Col xs={24} sm={12} lg={8} key={dbField}>
                <Form.Item label={dbField}>
                  <Input value={csvColumn} disabled aria-label={`${dbField} matched column`} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="Unmatched Fields">
        {unmatchedDbFields.length === 0 ? (
          <Text type="secondary">Every known field was automatically matched.</Text>
        ) : (
          <Row gutter={16}>
            {unmatchedDbFields.map((dbField) => {
              const required = requiredImportMatchFields.includes(dbField)
              return (
                <Col xs={24} sm={12} lg={8} key={dbField}>
                  <Form.Item
                    name={dbField}
                    label={dbField}
                    rules={required ? [{ required: true, message: `${dbField} must be mapped to a column` }] : undefined}
                  >
                    <Select
                      showSearch
                      allowClear={!required}
                      placeholder="Select CSV column"
                      options={availableColumns.map((column) => ({ label: column, value: column }))}
                      aria-label={`Map ${dbField}`}
                    />
                  </Form.Item>
                </Col>
              )
            })}
          </Row>
        )}
      </Card>
    </Form>
  )
}

export default ImportMatchForm
