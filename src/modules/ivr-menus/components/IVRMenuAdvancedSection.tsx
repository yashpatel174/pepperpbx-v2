import { Card, Col, Form, Input, Row } from 'antd'
import RingBackSelect from '../../ring-groups/components/RingBackSelect'
import ToggleSelectInput from '../../../components/common/ToggleSelectInput'
import {
  confirmAttemptsRules,
  digitLengthRules,
  interDigitTimeoutRules,
  maxFailuresRules,
  maxTimeoutsRules,
  noEdgeWhitespaceRule,
  pinRules,
} from '../ivr-menu.validation'
import type { IVRMenuSelectOptions } from '../ivr-menu.types'

interface IVRMenuAdvancedSectionProps {
  soundOptions: IVRMenuSelectOptions
  optionsLoading: boolean
  disabled: boolean
}

const colProps = { xs: 24, sm: 12, lg: 8 }

/**
 * Axion's "Advance Form" card (ivr-menus.md §8 AdvancedForm) — exactly its twelve fields, with the
 * audited defaults coming from `ivrMenuFormDefaults`. Numeric fields are text inputs validated as
 * non-negative digit strings; the service coerces them to numbers (§27).
 */
const IVRMenuAdvancedSection = ({ soundOptions, optionsLoading, disabled }: IVRMenuAdvancedSectionProps) => (
  <Card title="Advanced">
    <Row gutter={[16, 0]}>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_invalid_sound" label="Invalid Sound" tooltip="Played when an invalid option is chosen" rules={[noEdgeWhitespaceRule]}>
          <ToggleSelectInput
            options={soundOptions}
            placeholder="Select invalid sound"
            loading={optionsLoading}
            disabled={disabled}
            canToggle
            allowClear
            aria-label="Invalid sound"
          />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_exit_sound" label="Exit Sound" tooltip="Played when leaving the menu" rules={[noEdgeWhitespaceRule]}>
          <RingBackSelect options={soundOptions} placeholder="Select or type exit sound" loading={optionsLoading} disabled={disabled} aria-label="Exit sound" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_pin_number" label="PIN Number" tooltip="Optional PIN to secure access to the menu" rules={pinRules}>
          <Input type={'number'} maxLength={20} placeholder="Enter PIN number" aria-label="PIN number" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_confirm_macro" label="Confirm Macro" tooltip="Enter the confirm macro" rules={[noEdgeWhitespaceRule]}>
          <Input placeholder="Enter confirm macro" aria-label="Confirm macro" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_confirm_key" label="Confirm Key" tooltip="Enter the confirm key" rules={[noEdgeWhitespaceRule]}>
          <Input placeholder="Enter confirm key" aria-label="Confirm key" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_tts_engine" label="TTS Engine" tooltip="Text-to-speech engine" rules={[noEdgeWhitespaceRule]}>
          <Input placeholder="Enter TTS engine" aria-label="TTS engine" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_tts_voice" label="TTS Voice" tooltip="Text-to-speech voice" rules={[noEdgeWhitespaceRule]}>
          <Input placeholder="Enter TTS voice" aria-label="TTS voice" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_confirm_attempts" label="Confirm Attempts" tooltip="Maximum confirm attempts" validateFirst rules={confirmAttemptsRules}>
          <Input type={'number'} maxLength={20} placeholder="Enter confirm attempts" aria-label="Confirm attempts" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item
          name="ivr_menu_inter_digit_timeout"
          label="Inter-Digit Timeout"
          tooltip="Milliseconds to wait between digits"
          rules={interDigitTimeoutRules}
        >
          <Input type={'number'} maxLength={5} placeholder="Enter inter-digit timeout" aria-label="Inter-digit timeout" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_max_failures" label="Max Failures" tooltip="Retries before exiting the menu" validateFirst rules={maxFailuresRules}>
          <Input type={'number'} maxLength={20} placeholder="Enter max failures" aria-label="Max failures" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_max_timeouts" label="Max Timeouts" tooltip="Timeouts before exiting the menu" validateFirst rules={maxTimeoutsRules}>
          <Input type={'number'} maxLength={5} placeholder="Enter max timeouts" aria-label="Max timeouts" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="ivr_menu_digit_len" label="Digit Length" tooltip="Maximum digits allowed in input" validateFirst rules={digitLengthRules}>
          <Input type={'number'} maxLength={20} placeholder="Enter digit length" aria-label="Digit length" />
        </Form.Item>
      </Col>
    </Row>
  </Card>
)

export default IVRMenuAdvancedSection
