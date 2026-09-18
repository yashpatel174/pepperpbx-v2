import { Card, Col, Form, Input, Row, Select, Switch, theme, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ISO6391 from "iso-639-1";
import { domainRules, descriptionRules, nameRules, languageRules } from "../announcement.validation";
import type { HiveAnnouncementDetails } from "../announcement.types";

const { TextArea } = Input;

/** Full ISO 639-1 language list, e.g. { label: 'English', value: 'en' } — announcements.md §8/§26/§33. */
const languageOptions = ISO6391.getAllCodes().map((code) => ({
  label: ISO6391.getName(code),
  value: code,
}));

interface AnnouncementBasicSectionProps {
  mode: "create" | "edit";
  hive: HiveAnnouncementDetails;
  disabled?: boolean;
  onDomainChange: (value: string) => void;
}

/**
 * Basic-information card, shared by both Add and Edit via AnnouncementForm's `mode` prop — the
 * audit documents the same card in both modes (announcements.md §4's Screen/Page Audit), unlike
 * Outbound Routes' mode-conditional Basic section. Only Domain is mode-locked (disabled on Edit,
 * announcements.md §15/§33 — an announcement can't move between domains after creation).
 */
const AnnouncementBasicSection = ({ mode, hive, disabled, onDomainChange }: AnnouncementBasicSectionProps) => {
  const { token } = theme.useToken();

  return (
    <Card>
      <Row gutter={16} align={"middle"}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item name="phrase_name" label="Name" tooltip="Enter a name for this announcement" rules={nameRules}>
            <Input placeholder="Enter announcement name" aria-label="Announcement name" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="phrase_language"
            label="Language"
            tooltip="Select the announcement language"
            rules={languageRules}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select language"
              options={languageOptions}
              aria-label="Language"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item name="domain_name" label="Domain" tooltip="Select the domain" rules={domainRules}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select domain"
              disabled={mode === "edit"}
              onChange={onDomainChange}
              options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
              aria-label="Domain"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="phrase_description"
            label="Description"
            tooltip="Enter a description (optional)"
            rules={descriptionRules}
          >
            <TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 32 }}>
            <Form.Item name="phrase_enabled" valuePropName="checked" noStyle>
              <Switch disabled={disabled} aria-label="Enabled" />
            </Form.Item>
            <span>Enabled</span>
            <Tooltip title="Whether this announcement is active">
              <QuestionCircleOutlined
                aria-label="Enabled information"
                style={{ color: token.colorTextTertiary, fontSize: 12, cursor: "help", flexShrink: 0 }}
              />
            </Tooltip>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default AnnouncementBasicSection;
