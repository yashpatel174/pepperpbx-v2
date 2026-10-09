import { Card, Checkbox, Col, Empty, Form, Row, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import type { SelectOption } from "../voicemail.types";

interface VoicemailForwardSectionProps {
  options: SelectOption[];
}

/**
 * "Forward Destinations" card (voicemail.md §9): a checkbox list of the domain's other voicemails
 * in a scroll box (max height 200). Add sends the checked set; Edit sends the added/removed diff.
 */
const VoicemailForwardSection = ({ options }: VoicemailForwardSectionProps) => (
  <Card
    title={
      <>
        Forward Destinations{" "}
        <Tooltip title="Forward voicemail messages to additional destinations">
          <QuestionCircleOutlined aria-label="Forward Destinations information" />
        </Tooltip>
      </>
    }
  >
    <Form.Item name="addDestination" noStyle>
      <Checkbox.Group style={{ width: "100%" }}>
        <div style={{ maxHeight: 200, overflowY: "auto", overflowX: "hidden", width: "100%" }}>
          {options.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No other voicemails in this domain." />
          ) : (
            <Row gutter={[16, 8]}>
              {options.map((option) => (
                <Col xs={12} md={6} lg={3} xxl={3} key={option.value}>
                  <Checkbox value={option.value}>{option.label}</Checkbox>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Checkbox.Group>
    </Form.Item>
  </Card>
);

export default VoicemailForwardSection;
