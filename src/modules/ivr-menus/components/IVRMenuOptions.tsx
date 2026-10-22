import { Button, Card, Form, Input, Select, Table, Tooltip } from 'antd'
import type { FormListFieldData, TableColumnsType } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import ToggleSelectInput from '../../../components/common/ToggleSelectInput'
import { emptyOptionRow, orderOptions } from '../ivr-menu.constants'
import { noEdgeWhitespaceRule } from '../ivr-menu.validation'
import type { IVRMenuSelectOptions } from '../ivr-menu.types'

interface IVRMenuOptionsProps {
  destinationOptions: IVRMenuSelectOptions
  optionsLoading: boolean
  disabled: boolean
}

const cellItemStyle = { marginBottom: 0 }

/**
 * The Options field array (ivr-menus.md §5 "Options table" / §8): Option digits, Destination
 * (select-or-type), Order (000–999), Description, per-row delete. Rows are added/removed freely —
 * no maximum, since neither the audit nor a backend confirms one. Rendered as a table that scrolls
 * horizontally on narrow screens, matching Axion's Options table.
 */
const IVRMenuOptions = ({ destinationOptions, optionsLoading, disabled }: IVRMenuOptionsProps) => (
  <Form.List name="options">
    {(fields, { add, remove }) => {
      const columns: TableColumnsType<FormListFieldData> = [
        {
          title: 'Option',
          key: 'option_digits',
          width: 120,
          render: (_, field) => (
            <Form.Item name={[field.name, 'option_digits']} rules={[noEdgeWhitespaceRule]} style={cellItemStyle}>
              <Input placeholder="e.g. 1" aria-label={`Option ${field.name + 1} digits`} />
            </Form.Item>
          ),
        },
        {
          title: 'Destination',
          key: 'destination',
          width: 300,
          render: (_, field) => (
            <Form.Item name={[field.name, 'destination']} rules={[noEdgeWhitespaceRule]} style={cellItemStyle}>
              <ToggleSelectInput
                options={destinationOptions}
                placeholder="Select destination"
                loading={optionsLoading}
                disabled={disabled}
                canToggle
                allowClear
                aria-label={`Option ${field.name + 1} destination`}
              />
            </Form.Item>
          ),
        },
        {
          title: 'Order',
          key: 'order',
          width: 110,
          render: (_, field) => (
            <Form.Item name={[field.name, 'order']} style={cellItemStyle}>
              <Select showSearch optionFilterProp="label" options={orderOptions} aria-label={`Option ${field.name + 1} order`} />
            </Form.Item>
          ),
        },
        {
          title: 'Description',
          key: 'description',
          width: 220,
          render: (_, field) => (
            <Form.Item name={[field.name, 'description']} rules={[noEdgeWhitespaceRule]} style={cellItemStyle}>
              <Input placeholder="Enter description" aria-label={`Option ${field.name + 1} description`} />
            </Form.Item>
          ),
        },
        {
          title: 'Actions',
          key: 'actions',
          width: 80,
          align: 'center',
          render: (_, field) => (
            <Tooltip title="Delete option">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={disabled}
                onClick={() => remove(field.name)}
                aria-label={`Delete option ${field.name + 1}`}
              />
            </Tooltip>
          ),
        },
      ]

      return (
        <Card
          title="Options"
          extra={
            <Button icon={<PlusOutlined />} type='primary' onClick={() => add(emptyOptionRow())} disabled={disabled}>
              Add
            </Button>
          }
        >
          <Table<FormListFieldData>
            rowKey="key"
            size="small"
            columns={columns}
            dataSource={fields}
            pagination={false}
            scroll={{ x: 830 }}
            locale={{ emptyText: 'No options yet. Use Add to create one.' }}
          />
        </Card>
      )
    }}
  </Form.List>
)

export default IVRMenuOptions
