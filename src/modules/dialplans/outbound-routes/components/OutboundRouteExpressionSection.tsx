import { Card, Col, Form, Input, Row, Select, Typography } from "antd";
import { dialplanExpressionPresets } from "../outbound-route.constants";
import { noEdgeWhitespaceRule } from "../outbound-route.validation";

const { TextArea } = Input;

const OutboundRouteExpressionSection = () => {
  const form = Form.useFormInstance();

  const handlePresetChange = (value: string) => {
    form.setFieldValue("dialplan_expression", value);
    form.validateFields(["dialplan_expression"]);
  };

  return (
    <Card>
      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item
            label="Dialplan Expression"
            tooltip="Shortcut to create the outbound dialplan entries for this gateway"
          >
            <Select
              allowClear
              placeholder="Select dialplan expression"
              options={dialplanExpressionPresets}
              onChange={handlePresetChange}
              aria-label="Dialplan expression shortcut"
            />
          </Form.Item>

          <Form.Item
            name="dialplan_expression"
            validateFirst
            rules={[
              {
                required: true,
                message: "Dialplan expression is required.",
              },
              noEdgeWhitespaceRule,
            ]}
          >
            <TextArea
              rows={10}
              placeholder="Enter Dialplan Expression"
              aria-label="Dialplan expression"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Typography.Text type="secondary">
            Pick a shortcut to prefill this field, or type your own regular expression. Newlines are kept as-is.
          </Typography.Text>
        </Col>
      </Row>
    </Card>
  );
};

export default OutboundRouteExpressionSection;
