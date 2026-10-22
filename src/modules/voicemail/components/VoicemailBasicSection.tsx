import { Card, Col, Form, Input, Row, Select, theme } from 'antd'
import { extensionReuseNote } from '../../../components/common/extensionReuseNote'
import { voicemailFileOptions } from '../voicemail.constants'
import { alternateGreetIdRules, descriptionRules, mailToRules, passwordRules, voicemailIdRules } from '../voicemail.validation'
import type { HiveVoicemailDetails, SelectOption } from '../voicemail.types'

interface VoicemailBasicSectionProps {
  mode: 'create' | 'edit'
  hive: HiveVoicemailDetails
  greetingOptions: SelectOption[]
  optionsLoading?: boolean
  onDomainChange: (value: string) => void
}

/**
 * Main fields card, shared by Add and Edit via VoicemailForm's `mode` (voicemail.md §9). Field
 * order follows the audit: Voicemail ID, Password, Default, Domain, Alternate Greet ID, Mail To,
 * Voicemail File, Description. Only Domain is mode-locked (disabled in Edit, §10).
 */
const VoicemailBasicSection = ({ mode, hive, greetingOptions, optionsLoading, onDomainChange }: VoicemailBasicSectionProps) => {
  const { token } = theme.useToken()

  return (
    <Card>
      <Row gutter={16}>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            name="voicemail_id"
            label="Voicemail ID"
            validateFirst
            required
            rules={voicemailIdRules(hive)}
            extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
          >
            <Input placeholder="Enter voicemail id" aria-label="Voicemail ID" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item name="voicemail_password" label="Password" tooltip="Enter the password" validateFirst required rules={passwordRules}>
            <Input.Password placeholder="Enter password" maxLength={30} autoComplete="new-password" aria-label="Password" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item name="greeting_id" label="Default" tooltip="Select the desired greeting">
            <Select options={greetingOptions} loading={optionsLoading} aria-label="Default greeting" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item name="domain_name" label="Domain" tooltip="Set the domain">
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select domain"
              disabled={mode === 'edit'}
              onChange={onDomainChange}
              options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
              aria-label="Domain"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            name="voicemail_alternate_greet_id"
            label="Alternate Greet ID"
            tooltip="An alternative greet ID used in the default greeting"
            rules={alternateGreetIdRules}
          >
            <Input type={'number'} placeholder="Enter alternate greet id" aria-label="Alternate greet ID" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item name="voicemail_mail_to" label="Mail To" tooltip="Enter the email address to send voicemail to" rules={mailToRules}>
            <Input placeholder="Enter mail to" aria-label="Mail to" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Form.Item
            name="voicemail_file"
            label="Voicemail File"
            tooltip="Select a listening option to include with the email notification"
          >
            <Select options={voicemailFileOptions} aria-label="Voicemail file" />
          </Form.Item>
        </Col>

        {/* Axion renders Description as a single-line input (its `Area` attribute is ignored,
            voicemail.md §9 note 1), max length 300 — reproduced as documented. */}
        <Col xs={24} lg={16}>
          <Form.Item name="voicemail_description" label="Description" tooltip="Enter the description" rules={descriptionRules}>
            <Input placeholder="Enter description" maxLength={300} aria-label="Description" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

export default VoicemailBasicSection
