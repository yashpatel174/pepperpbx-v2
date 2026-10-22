import { Button, Table, Tooltip, Typography, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import StatusToggleTag from '../../../components/common/StatusToggleTag'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import type { UserSetting } from '../users.types'

const { Text } = Typography

interface UserSettingsTableProps {
  data: UserSetting[]
  loading: boolean
  onEdit: (setting: UserSetting) => void
}

const optionalText = (value?: string) => value || <Text type="secondary">—</Text>

const UserSettingsTable = ({ data, loading, onEdit }: UserSettingsTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<UserSetting> = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Subcategory', dataIndex: 'subcategory', key: 'subcategory' },
    { title: 'Value', dataIndex: 'value', key: 'value', ellipsis: true, render: optionalText },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 130,
      render: (enabled: boolean) => (
        <StatusToggleTag enabled={enabled} iconStyle={{ color: '#fff' }} style={{ cursor: 'default' }}>
          {String(enabled)}
        </StatusToggleTag>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true, render: optionalText },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => onEdit(record)}
            aria-label={`Edit setting ${record.subcategory}`}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Table<UserSetting>
      rowKey="user_setting_uuid"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ x: 800 }}
      onRow={onRow}
    />
  )
}

export default UserSettingsTable
