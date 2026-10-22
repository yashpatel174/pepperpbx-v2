import { Button, Card, Col, Form, Row, Select, Space, Tooltip, Typography, theme } from "antd";
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";
import { functionOptions, pauseActionOptions, structureOrderOptions } from "../announcement.constants";
import { structureActionRules, structureFunctionRules, structureOrderRules } from "../announcement.validation";
import type { ActionOptionGroup, AnnouncementStructureItem } from "../announcement.types";

interface AnnouncementStructureSectionProps {
  playOptions: ActionOptionGroup[];
  executeOptions: ActionOptionGroup[];
  optionsLoading?: boolean;
  disabled?: boolean;
  /** Axion's pbx_admin/pbx_axiontech gate on the Execute select ↔ free-text toggle. */
  canUseFreeText: boolean;
}

/** Shows the placeholder for a cleared ("") Action rather than an empty selection. */
const emptyAsUnset = (value?: string) => ({ value: value || undefined });

/**
 * "Structure" (`phrase_details`) — an ordered, dynamic list of Function/Action/Order rows. The
 * Action input depends on the row's Function (announcements.md §8/§9): Play → searchable grouped
 * select of the domain's play options; Pause → fixed 0.1–5.0 durations; Execute → the shared
 * ToggleSelectInput over the domain's grouped execute options (free-text mode for permitted users;
 * a saved value missing from the options is shown under "Other" and kept unchanged). Only the
 * option's `value` string is ever stored — nothing is executed client-side; the backend acts on
 * the saved `phrase_details`.
 */
const AnnouncementStructureSection = ({
  playOptions,
  executeOptions,
  optionsLoading,
  disabled,
  canUseFreeText,
}: AnnouncementStructureSectionProps) => {
  const { token } = theme.useToken();
  const form = Form.useFormInstance();

  const phraseDetails = (Form.useWatch<AnnouncementStructureItem[]>("phrase_details", form) ??
    []) as AnnouncementStructureItem[];

  return (
    <Card title="Structure">
      <Form.List name="phrase_details">
        {(fields, { add, remove }) => (
          <>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {fields.map((field, index) => {
                const rowFunction = phraseDetails[index]?.phrase_detail_function;

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
                          // Every Function change clears this row's Action (Order is kept).
                          onChange={() => form.setFieldValue(["phrase_details", field.name, "phrase_detail_data"], "")}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={10} md={12}>
                      <Form.Item
                        label={index === 0 ? "Action" : undefined}
                        tooltip={index === 0 ? "Depends on the selected function" : undefined}
                      >
                        {rowFunction === "pause-execute" ? (
                          <Form.Item
                            name={[field.name, "phrase_detail_data"]}
                            noStyle
                            rules={structureActionRules}
                            getValueProps={emptyAsUnset}
                          >
                            <Select
                              placeholder="Select duration (seconds)"
                              options={pauseActionOptions}
                              disabled={disabled}
                              aria-label={`Action ${index + 1}`}
                            />
                          </Form.Item>
                        ) : rowFunction === "execute" ? (
                          <Form.Item name={[field.name, "phrase_detail_data"]} noStyle rules={structureActionRules}>
                            <ToggleSelectInput
                              options={executeOptions}
                              placeholder="Select execute action"
                              loading={optionsLoading}
                              disabled={disabled}
                              canToggle={canUseFreeText}
                              aria-label={`Action ${index + 1}`}
                            />
                          </Form.Item>
                        ) : (
                          <Form.Item
                            name={[field.name, "phrase_detail_data"]}
                            noStyle
                            rules={structureActionRules}
                            getValueProps={emptyAsUnset}
                          >
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
