import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { pageSizeOptions } from '../time-group.constants'
import type { TimeGroup } from '../time-group.types'

const { Text } = Typography

interface TimeGroupTableProps {
  data: TimeGroup[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canEditRow: boolean
  canCopyRow: boolean
  canDeleteRow: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (item: TimeGroup) => void
  onCopy: (item: TimeGroup) => void
  onDelete: (item: TimeGroup) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

/** Truncated one-line text with the full value in a tooltip (Axion's max-width 150px cells, §5). */
const renderTruncated = (value?: string) =>
  value ? (
    <Tooltip title={value}>
      <Text ellipsis style={{ maxWidth: '100%' }}>
        {value}
      </Text>
    </Tooltip>
  ) : (
    <Text type="secondary">—</Text>
  )

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/**
 * Columns per time-groups.md §5: Name, Context, Order, Description, Domain (Show All only, §25),
 * Actions (Edit / Copy / Delete — disabled, not hidden, without permission). Text columns sort
 * client-side on the loaded page only, as in Axion (§3 step 8). Axion's commented-out Extension and
 * Enabled columns are dead code and not ported (§5).
 */
const TimeGroupTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canCopyRow,
  canDeleteRow,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  selectedRowKeys,
  onSelectionChange,
}: TimeGroupTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<TimeGroup>['rowSelection'] = {
    selectedRowKeys,
    // Selection is keyed by dialplan_uuid and spans pages.
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  }

  const columns: TableColumnsType<TimeGroup> = [
    {
      title: 'Name',
      dataIndex: 'dialplan_name',
      key: 'dialplan_name',
      width: 200,
      render: renderTruncated,
      sorter: (a, b) => a.dialplan_name.localeCompare(b.dialplan_name),
    },
    {
      title: 'Context',
      dataIndex: 'dialplan_context',
      key: 'dialplan_context',
      width: 220,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.dialplan_context, b.dialplan_context),
    },
    {
      title: 'Order',
      dataIndex: 'dialplan_order',
      key: 'dialplan_order',
      width: 100,
      render: (value: number | null) => (value === null ? <Text type="secondary">—</Text> : value),
      sorter: (a, b) => (a.dialplan_order ?? 0) - (b.dialplan_order ?? 0),
    },
    {
      title: 'Description',
      dataIndex: 'dialplan_description',
      key: 'dialplan_description',
      width: 260,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.dialplan_description, b.dialplan_description),
    },
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            width: 220,
            render: renderTruncated,
            sorter: (a: TimeGroup, b: TimeGroup) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 90,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: gate with <PermissionGuard> (pbx_timeconditions_all|edit|view) once RBAC is populated. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: canEditRow ? token.colorPrimary : undefined }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit time group ${record.dialplan_name}`}
            />
          </Tooltip>
          {/* TODO: gate with <PermissionGuard> (pbx_timeconditions_add) once RBAC is populated. */}
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: canCopyRow ? token.colorPrimary : undefined }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy time group ${record.dialplan_name}`}
            />
          </Tooltip>
          {/* TODO: gate with <PermissionGuard> (pbx_timeconditions_all) once RBAC is populated. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete time group ${record.dialplan_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<TimeGroup>
      rowKey="dialplan_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (count) => `${count} time groups`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: showAll ? 1150 : 930 }}
      onRow={onRow}
    />
  )
}

export default TimeGroupTable
