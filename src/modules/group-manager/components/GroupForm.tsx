import { Card, Col, Form, Input, Row, Select } from 'antd'
import { levelOptions } from '../group-manager.constants'
import { groupDescriptionRules, groupLevelRules, groupNameRules } from '../group-manager.validation'
import { isGroupNameTaken } from '../group-manager.service'
import type { GroupFormValues } from '../group-manager.types'

export interface GroupFormProps {
  mode: 'create' | 'edit'
  initialValues: GroupFormValues
  /** Excluded from the duplicate-name check when editing. */
  groupId?: string
  /** Domains the dropdown offers (id saved, name shown). May be empty. */
  domainOptions: { id: string; name: string }[]
  /** Protected groups keep their name and stay global. */
  nameLocked?: boolean
  submitting: boolean
  onSubmit: (values: GroupFormValues) => void
  /** HTML form id — the page toolbar's Save button targets it via `form={formId}`. */
  formId: string
}

/**
 * Shared by AddGroupPage and EditGroupPage. Name, Level and Description are editable; Domain is fixed
 * once a group exists. Protected groups keep their name, level and scope (`nameLocked`). Protected
 * itself has no confirmed PepperPBX behavior beyond that, so it stays read-only data on the model.
 */
const GroupForm = ({ mode, initialValues, groupId, domainOptions, nameLocked, submitting, onSubmit, formId }: GroupFormProps) => (
  <Form<GroupFormValues>
    id={formId}
    layout="vertical"
    initialValues={initialValues}
    onFinish={onSubmit}
    disabled={submitting}
  >
    <Card>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="group_name"
            label="Name"
            validateFirst
            validateDebounce={300}
            tooltip={nameLocked ? 'Protected groups cannot be renamed' : undefined}
            rules={[
              ...groupNameRules,
              {
                validator: async (_, value?: string) => {
                  if (nameLocked || !value?.trim()) return
                  if (await isGroupNameTaken(value, mode === 'edit' ? groupId : undefined)) {
                    throw new Error('A group with this name already exists')
                  }
                },
              },
            ]}
          >
            <Input placeholder="Group name" disabled={nameLocked} maxLength={64} aria-label="Group name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="domain_id"
            label="Domain"
            tooltip={nameLocked ? 'Protected groups apply to every domain' : 'Leave empty for a group that applies to every domain'}
          >
            <Select
              allowClear
              disabled={nameLocked || mode === 'edit'}
              showSearch={{ optionFilterProp: 'label' }}
              placeholder={domainOptions.length === 0 ? 'No domains available' : 'All domains'}
              notFoundContent="No domains available"
              options={domainOptions.map((d) => ({ value: d.id, label: d.name }))}
              aria-label="Domain"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="group_level" label="Level" rules={groupLevelRules} tooltip={nameLocked ? 'Protected groups keep their level' : undefined}>
            <Select
              disabled={nameLocked}
              // An existing level outside the 10–90 list (seed data) stays selectable so editing never drops it.
              options={
                levelOptions.some((o) => o.value === initialValues.group_level)
                  ? levelOptions
                  : [...levelOptions, { value: initialValues.group_level, label: String(initialValues.group_level) }].sort((a, b) => a.value - b.value)
              }
              aria-label="Group level"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="group_description" label="Description" rules={groupDescriptionRules}>
            <Input.TextArea rows={3} placeholder="Description" maxLength={255} aria-label="Group description" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  </Form>
)

export default GroupForm
