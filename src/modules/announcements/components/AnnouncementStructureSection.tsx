import { useState } from "react";
import { Button, Card, Col, Form, Input, Row, Select, Space, Tooltip, Typography, theme } from "antd";
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { functionOptions, pauseActionOptions, structureOrderOptions } from "../announcement.constants";
import { structureActionRules, structureFunctionRules, structureOrderRules } from "../announcement.validation";
import type { AnnouncementStructureItem, SelectOption } from "../announcement.types";

interface AnnouncementStructureSectionProps {
  playOptions: SelectOption[];
  executeOptions: SelectOption[];
  optionsLoading?: boolean;
  disabled?: boolean;
}

/**
 * "Structure" (`phrase_details`) — an ordered, dynamic list of Function/Action/Order rows.
 *
 * Execute Action supports two modes:
 *  - Select mode: choose from the predefined domain-scoped execute options.
 *  - Text mode: manually enter a custom dialplan action.
 *
 * The predefined option value is never edited inside Select mode.
 * For example:
 *   label: "Transfer to Remote Office"
 *   value: "transfer:301 XML remote.pepperpbx.local"
 *
 * Clicking the toggle switches the same field to a normal Input so the
 * user can edit/type a custom value.
 */
const AnnouncementStructureSection = ({
  playOptions,
  executeOptions,
  optionsLoading,
  disabled,
}: AnnouncementStructureSectionProps) => {
  const { token } = theme.useToken();
  const form = Form.useFormInstance();

  const phraseDetails = (Form.useWatch<AnnouncementStructureItem[]>("phrase_details", form) ??
    []) as AnnouncementStructureItem[];

  // Stores whether each Execute row is currently using the free-text input.
  // Uses Form.List field.key so removing/reordering rows does not incorrectly
  // apply the previous row's state to another row.
  const [executeTextMode, setExecuteTextMode] = useState<Record<number, boolean>>({});

  const handleExecuteToggle = (fieldKey: number) => {
    setExecuteTextMode((previous) => ({
      ...previous,
      [fieldKey]: !previous[fieldKey],
    }));
  };

  return (
    <Card title="Structure">
      <Form.List name="phrase_details">
        {(fields, { add, remove }) => (
          <>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {fields.map((field, index) => {
                const rowFunction = phraseDetails[index]?.phrase_detail_function;
                const isTextMode = !!executeTextMode[field.key];

                return (
                  <Row key={field.key} gutter={8} align="top">
                    <Col xs={24} sm={8} md={6}>
                      <Form.Item
                        name={[field.name, "phrase_detail_function"]}
                        label={index === 0 ? "Function" : undefined}
                        rules={structureFunctionRules}
                      >
                        <Select
                          placeholder="Select function"
                          options={functionOptions}
                          disabled={disabled}
                          aria-label={`Function ${index + 1}`}
                          onChange={() => {
                            form.setFieldValue(["phrase_details", field.name, "phrase_detail_data"], undefined);

                            // Reset Execute back to Select mode whenever
                            // the function changes.
                            setExecuteTextMode((previous) => ({
                              ...previous,
                              [field.key]: false,
                            }));
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={10} md={12}>
                      <Form.Item
                        label={index === 0 ? "Action" : undefined}
                        tooltip={index === 0 ? "Depends on the selected function" : undefined}
                      >
                        {rowFunction === "pause-execute" ? (
                          <Form.Item name={[field.name, "phrase_detail_data"]} noStyle rules={structureActionRules}>
                            <Select
                              placeholder="Select duration (seconds)"
                              options={pauseActionOptions}
                              disabled={disabled}
                              aria-label={`Action ${index + 1}`}
                            />
                          </Form.Item>
                        ) : rowFunction === "execute" ? (
                          <Row gutter={8} wrap={false}>
                            <Col flex="auto">
                              <Form.Item name={[field.name, "phrase_detail_data"]} noStyle rules={structureActionRules}>
                                {isTextMode ? (
                                  <Input
                                    placeholder="Execute action"
                                    disabled={disabled}
                                    readOnly
                                    aria-label={`Action ${index + 1}`}
                                  />
                                ) : (
                                  <Select
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder="Select execute action"
                                    options={executeOptions}
                                    loading={optionsLoading}
                                    disabled={disabled}
                                    aria-label={`Action ${index + 1}`}
                                  />
                                )}
                              </Form.Item>
                            </Col>

                            <Col flex="none">
                              <Tooltip
                                title={
                                  isTextMode ? "Switch to predefined execute actions" : "Switch to custom typed action"
                                }
                              >
                                <Button
                                  type="default"
                                  disabled={disabled}
                                  onClick={() => handleExecuteToggle(field.key)}
                                  aria-label={`Toggle action input type for row ${index + 1}`}
                                >
                                  ❮
                                </Button>
                              </Tooltip>
                            </Col>
                          </Row>
                        ) : (
                          <Form.Item name={[field.name, "phrase_detail_data"]} noStyle rules={structureActionRules}>
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Select music-on-hold file"
                              options={playOptions}
                              loading={optionsLoading}
                              disabled={disabled}
                              aria-label={`Action ${index + 1}`}
                            />
                          </Form.Item>
                        )}
                      </Form.Item>
                    </Col>

                    <Col xs={18} sm={4} md={4}>
                      <Form.Item
                        name={[field.name, "phrase_detail_order"]}
                        label={index === 0 ? "Order" : undefined}
                        rules={structureOrderRules}
                      >
                        <Select
                          showSearch
                          options={structureOrderOptions}
                          placeholder="Order"
                          disabled={disabled}
                          aria-label={`Order ${index + 1}`}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={6} sm={2} md={2}>
                      <Form.Item label={index === 0 ? " " : undefined}>
                        <Tooltip title="Remove row">
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            disabled={disabled}
                            onClick={() => remove(field.name)}
                            aria-label={`Remove structure row ${index + 1}`}
                          />
                        </Tooltip>
                      </Form.Item>
                    </Col>
                  </Row>
                );
              })}
            </Space>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              disabled={disabled}
              onClick={() =>
                add({
                  phrase_detail_function: undefined,
                  phrase_detail_data: undefined,
                  phrase_detail_order: undefined,
                })
              }
              style={{ marginTop: fields.length ? 12 : 0 }}
            >
              Add Row
            </Button>

            <div style={{ marginTop: 8 }}>
              <Space size={4}>
                <Typography.Text type="secondary">
                  Optional — build a play/pause/execute sequence for this announcement.
                </Typography.Text>

                <Tooltip title="Function determines the Action input: Play selects a music-on-hold file, Pause selects a duration, Execute selects a predefined dialplan action or lets you type a custom action.">
                  <QuestionCircleOutlined
                    style={{
                      color: token.colorTextTertiary,
                      fontSize: 12,
                      cursor: "help",
                    }}
                  />
                </Tooltip>
              </Space>
            </div>
          </>
        )}
      </Form.List>
    </Card>
  );
};

export default AnnouncementStructureSection;
