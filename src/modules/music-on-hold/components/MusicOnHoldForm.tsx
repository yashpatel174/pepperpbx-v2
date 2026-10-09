import { Col, Form, Input, Row, Select } from 'antd'
import type { FormInstance } from 'antd'
import FormSwitchField from '../../../components/common/FormSwitchField'
import { mohChannelsOptions, mohRateOptions } from '../music-on-hold.constants'
import { numericRules, timerNameRules } from '../music-on-hold.validation'
import type { MohEditFormValues } from '../music-on-hold.types'

interface MusicOnHoldFormProps {
  formId: string
  form: FormInstance<MohEditFormValues>
  initialValues: MohEditFormValues
  chimeFileOptions: string[]
  /** True while saving, or when the user may only view (music-on-hold.md §14: all editable fields disabled). */
  disabled: boolean
  onFinish: (values: MohEditFormValues) => void | Promise<void>
}

const colProps = { xs: 24, md: 12 }

/**
 * The Edit form (music-on-hold.md §8): Category, Path, Rate and Domain are always read-only; the
 * rest configure the category. Data loading and submission live in EditMusicOnHoldPage.
 */
const MusicOnHoldForm = ({ formId, form, initialValues, chimeFileOptions, disabled, onFinish }: MusicOnHoldFormProps) => (
  <Form<MohEditFormValues> id={formId} form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish} style={{ maxWidth: 900 }}>
    <Row gutter={16}>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_name" label="Category">
          <Input disabled aria-label="Category" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_path" label="Path">
          <Input disabled aria-label="Path" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_rate" label="Rate">
          <Select disabled options={mohRateOptions} aria-label="Rate" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="domain_name" label="Domain">
          <Input disabled aria-label="Domain" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_channels" label="Channels" required rules={[{ required: true, message: 'Channels required' }]}>
          <Select disabled={disabled} options={mohChannelsOptions} aria-label="Channels" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_interval" label="Interval" validateFirst rules={numericRules}>
          <Input disabled={disabled} type={'number'} aria-label="Interval" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_timer_name" label="Timer Name" validateFirst required rules={timerNameRules}>
          <Input disabled={disabled} aria-label="Timer name" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_chime_list" label="Chime File">
          <Select
            allowClear
            showSearch
            disabled={disabled}
            placeholder="Select chime file"
            options={chimeFileOptions.map((name) => ({ label: name, value: name }))}
            aria-label="Chime file"
          />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_chime_freq" label="Chime Frequency" validateFirst rules={numericRules}>
          <Input disabled={disabled} type={'number'} aria-label="Chime frequency" />
        </Form.Item>
      </Col>
      <Col {...colProps}>
        <Form.Item name="music_on_hold_chime_max" label="Chime Maximum" validateFirst rules={numericRules}>
          <Input disabled={disabled} type={'number'}aria-label="Chime maximum" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <FormSwitchField name="music_on_hold_shuffle" label="Shuffle" disabled={disabled} />
      </Col>
    </Row>
  </Form>
)

export default MusicOnHoldForm
