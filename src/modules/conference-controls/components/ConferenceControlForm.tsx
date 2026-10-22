import { Card, Col, Form, Input, Row, Space } from "antd";
import FormSwitchField from "../../../components/common/FormSwitchField";
import ConferenceControlDetailsSection from "./ConferenceControlDetailsSection";
import { nameRules, noEdgeWhitespaceRule } from "../conference-control.validation";
import type { ConferenceControlFormValues } from "../conference-control.types";

const { TextArea } = Input;

export interface ConferenceControlFormProps {
  mode: "create" | "edit";
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string;
  initialValues: Partial<ConferenceControlFormValues>;
  /** False for view-only users — the whole form becomes read-only. */
  canManage: boolean;
  submitting: boolean;
  onSubmit: (values: ConferenceControlFormValues) => void;
}

/**
 * The single Add/Edit form for Conference Controls — Name, Description, Enabled
 * (conference-controls.md §8). In Edit mode it also renders the "Control" card with the DTMF rows;
 * Add never does, preserving Axion's two-step create-then-edit flow (§3/§26).
 */
const ConferenceControlForm = ({
  mode,
  formId,
  initialValues,
  canManage,
  submitting,
  onSubmit,
}: ConferenceControlFormProps) => {

  const [form] = Form.useForm<ConferenceControlFormValues>();

  return (
    <Form<ConferenceControlFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || !canManage}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="control_name" label="Name" tooltip="Enter the name" validateFirst rules={nameRules}>
                <Input placeholder="Enter name" aria-label="Conference control name" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={16}>
              <Form.Item
                name="control_description"
                label="Description"
                tooltip="Enter a description"
                rules={[noEdgeWhitespaceRule]}
              >
                <TextArea rows={3} placeholder="Enter description" aria-label="Description" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item >
                <FormSwitchField name="control_enabled" label="Enabled" tooltip="Select enabled" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {mode === "edit" && <ConferenceControlDetailsSection />}
      </Space>
    </Form>
  );
};

export default ConferenceControlForm;
