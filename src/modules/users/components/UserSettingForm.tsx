import { Card, Col, Form, Input, Row, Select } from 'antd'
import { enabledOptions } from '../users.constants'
import { categoryRules, enabledRules, settingTypeRules, subcategoryRules } from '../users.validation'
import type { UserSettingFormValues } from '../users.types'

export interface UserSettingFormProps {
  initialValues: UserSettingFormValues
  submitting: boolean
  onSubmit: (values: UserSettingFormValues) => void
  /** HTML form id — the page toolbar's Save button targets it via `form={formId}`. */
  formId: string
}

/** Shared by AddUserSettingPage and EditUserSettingPage. */
const UserSettingForm = ({ initialValues, submitting, onSubmit, formId }: UserSettingFormProps) => (
  <Form<UserSettingFormValues> id={formId} layout="vertical" initialValues={initialValues} onFinish={onSubmit} disabled={submitting}>
    <Card>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="category" label="Category" extra="Enter the category." rules={categoryRules}>
            <Input placeholder="Enter the category." aria-label="Category" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="type" label="Type" extra="Enter the setting type (ie. uuid, name, var, dir, etc)." rules={settingTypeRules}>
            <Input placeholder="Enter the setting type (ie. uuid, name, var, dir, etc)." aria-label="Type" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="subcategory" label="Subcategory" extra="Enter the subcategory." rules={subcategoryRules}>
            <Input placeholder="Enter the subcategory." aria-label="Subcategory" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="value" label="Value">
            <Input placeholder="Enter the value" aria-label="Value" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="enabled" label="Enabled" rules={enabledRules}>
            <Select options={enabledOptions} aria-label="Enabled" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter the description." aria-label="Description" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  </Form>
)

export default UserSettingForm
