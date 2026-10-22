import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import ISO6391 from 'iso-639-1'
import { defaultPageSize, announcementStatusLabels, pageSizeOptions } from '../announcement.constants'
import type { Announcement } from '../announcement.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import StatusToggleTag from '../../../components/common/StatusToggleTag'

const { Text } = Typography

interface AnnouncementTableProps {
  data: Announcement[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  /** Gates the Edit button/row-navigation — broadest tier (view-only users can still open the read-only form). */
  canEditRow: boolean
  /** Gates the Delete button — module-admin tier only, per the audit (announcements.md §14). */
  canDeleteRow: boolean
  /** Gates the inline Status pill — module-admin or edit tier, NOT view-only (announcements.md §14). */
  canToggleRow: boolean
  onPageChange: (page: number, pageSize: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (announcement: Announcement) => void
  onDelete: (announcement: Announcement) => void
  onToggleStatus: (announcement: Announcement) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const renderOptionalText = (value?: string) => value || <Text type="secondary">—</Text>

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/** "en" -> "en-English", matching the audit's exact display format (announcements.md §5/§27). */
const formatLanguage = (code: string): string => {
  const name = ISO6391.getName(code)
  return name ? `${code}-${name}` : code
}

const AnnouncementTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canDeleteRow,
  canToggleRow,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: AnnouncementTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<Announcement>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[])
    },
  }

  const columns: TableColumnsType<Announcement> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: renderOptionalText,
            sorter: (a: Announcement, b: Announcement) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),

    {
      title: 'Phrase',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },

    {
      title: 'Language',
      dataIndex: 'languageCode',
      key: 'languageCode',
      render: (code: string) => formatLanguage(code),
      sorter: (a, b) => compareOptional(a.languageCode, b.languageCode),
    },

    {
      title: 'Status',
      key: 'status',
      sorter: (a, b) => Number(a.enabled) - Number(b.enabled),
      render: (_, record) => {
        const isEnabled = record.enabled

        return (
          <StatusToggleTag
            enabled={isEnabled}
            tooltip={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}
            iconStyle={{ color: '#fff' }}
            style={{ cursor: canToggleRow ? 'pointer' : 'not-allowed', opacity: canToggleRow ? 1 : 0.6 }}
            onClick={() => canToggleRow && onToggleStatus(record)}
          >
            {announcementStatusLabels[isEnabled ? 'enabled' : 'disabled']}
          </StatusToggleTag>
        )
      },
    },

    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}> <div  style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}  >{value}</div></Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.description, b.description),
    },

    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 90,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="announcement.edit"> once RBAC
              permissions are populated from the backend. No Copy action exists for this module
              per the audit (announcements.md §3/§8/§32). */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit announcement ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete announcement ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<Announcement>
      rowKey="id"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (totalCount) => `${totalCount} announcements`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1000 }}
      onRow={onRow}
    />
  )
}

export default AnnouncementTable
