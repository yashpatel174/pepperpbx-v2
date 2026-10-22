import { Card, Col, Form, Input, Row, Select } from "antd";
import FormSwitchField from "../../../components/common/FormSwitchField";
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

  return (
    <Card>
      <Row gutter={16} >
        <Col xs={24} sm={12} lg={8}>
          <Form.Item name="phrase_name" label="Name" tooltip="Enter a name for this announcement" rules={nameRules}>
            <Input placeholder="Enter announcement name" aria-label="Announcement name" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
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

        <Col xs={24} sm={12} lg={8}>
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

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="phrase_description"
            label="Description"
            tooltip="Enter a description (optional)"
            rules={descriptionRules}
          >
            <TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FormSwitchField
            name="phrase_enabled"
            label="Enabled"
            tooltip="Whether this announcement is active"
            disabled={disabled}
            style={{ minHeight: 32 }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default AnnouncementBasicSection;
