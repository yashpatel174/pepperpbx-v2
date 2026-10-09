import { Button, Card, Col, Form, Input, Row, Select, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import ToggleSelectInput from '../../../components/common/ToggleSelectInput'
import { emptyOptionRow, optionOrderOptions } from '../voicemail.constants'
import { noEdgeWhitespaceRule } from '../voicemail.validation'
import type { SelectOptionGroup, VoicemailOption } from '../voicemail.types'

interface VoicemailOptionsSectionProps {
  destinationOptions: SelectOptionGroup[]
  optionsLoading?: boolean
  disabled: boolean
  /** Placeholder for Axion's admin-only free-text toggle on Destination (voicemail.md §9 note 2). */
  canToggleDestination: boolean
  /**
   * Deletes a SAVED option row on the server. Axion calls DELETE /deleteOptions the moment the
   * trash icon is clicked — no confirmation, not deferred to Save (voicemail.md §9 note 5) — so
   * the row is only removed from the form once this resolves.
   */
  onDeleteSavedOption: (optionUuid: string) => Promise<void>
}

const VoicemailOptionsSection = ({
  destinationOptions,
  optionsLoading,
  disabled,
  canToggleDestination,
  onDeleteSavedOption,
}: VoicemailOptionsSectionProps) => {
  const form = Form.useFormInstance()

  return (
    <Form.List name="options">
      {(fields, { add, remove }) => {
        const handleRemove = async (fieldName: number) => {
          const rows = (form.getFieldValue('options') ?? []) as VoicemailOption[]
          const uuid = rows[fieldName]?.voicemail_option_uuid

          if (uuid) {
            try {
              await onDeleteSavedOption(uuid)
            } catch {
              // Keep the row because it still exists server-side.
              return
            }
          }

          remove(fieldName)
        }

        return (
          <Card
            title="Options"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => add(emptyOptionRow())}
                disabled={disabled}
              >
                Add
              </Button>
            }
          >
            {fields.map((field, index) => (
              <div key={field.key}>
                <Row gutter={[16, 16]} align="bottom">
                  {/* Option */}
                  <Col xs={24} md={12} lg={6}>
                    {/* Registers the saved row's id so it survives onFinish. */}
                    <Form.Item
                      name={[field.name, 'voicemail_option_uuid']}
                      hidden
                      noStyle
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, 'voicemail_option_digits']}
                      label="Option"
                      rules={[noEdgeWhitespaceRule]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="Enter option"
                        disabled={disabled}
                        aria-label={`Option ${index + 1} digits`}
                      />
                    </Form.Item>
                  </Col>

                  {/* Destination */}
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item
                      name={[field.name, 'voicemail_option_param']}
                      label="Destination"
                      rules={[noEdgeWhitespaceRule]}
                      style={{ marginBottom: 0 }}
                    >
                      <ToggleSelectInput
                        options={destinationOptions}
                        placeholder="Select destination"
                        loading={optionsLoading}
                        disabled={disabled}
                        canToggle={canToggleDestination}
                        allowClear
                        aria-label={`Option ${index + 1} destination`}
                      />
                    </Form.Item>
                  </Col>

                  {/* Order */}
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item
                      name={[field.name, 'voicemail_option_order']}
                      label="Order"
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={optionOrderOptions}
                        disabled={disabled}
                        aria-label={`Option ${index + 1} order`}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  {/* Description */}
                  <Col xs={24} md={12} lg={5}>
                    <Form.Item
                      name={[field.name, 'voicemail_option_description']}
                      label="Description"
                      rules={[noEdgeWhitespaceRule]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={2}
                        maxLength={250}
                        placeholder="Enter description"
                        disabled={disabled}
                        aria-label={`Option ${index + 1} description`}
                      />
                    </Form.Item>
                  </Col>

                  {/* Delete */}
                  <Col xs={24} md={12} lg={1}>
                    <Form.Item
                      label=" "
                      style={{ marginBottom: 0 }}
                    >
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={disabled}
                          onClick={() => handleRemove(field.name)}
                          aria-label={`Delete option ${index + 1}`}
                        />
                      </Tooltip>
                    </Form.Item>
                  </Col>
                </Row>

                {index < fields.length - 1 && (
                  <div
                    style={{
                      borderBottom: '1px solid var(--ant-color-border)',
                      margin: '16px 0',
                    }}
                  />
                )}
              </div>
            ))}

            {fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                No options yet. Use Add to create one.
              </div>
            )}
          </Card>
        )
      }}
    </Form.List>
  )
}

export default VoicemailOptionsSection
