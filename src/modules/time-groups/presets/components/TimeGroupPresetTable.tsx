import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../../components/common/useStripedTableRow'
import StatusToggleTag from '../../../../components/common/StatusToggleTag'
import { pageSizeOptions } from '../../time-group.constants'
import type { TimeGroupPreset } from '../time-group-preset.types'

const { Text } = Typography

interface TimeGroupPresetTableProps {
  data: TimeGroupPreset[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canEditRow: boolean
  canCopyRow: boolean
  canDeleteRow: boolean
  canToggleRow: boolean
  /** uuids whose Status toggle is still in flight — that pill ignores clicks until it settles. */
  pendingToggles: ReadonlySet<string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (item: TimeGroupPreset) => void
  onCopy: (item: TimeGroupPreset) => void
  onDelete: (item: TimeGroupPreset) => void
  onToggle: (item: TimeGroupPreset) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

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

/**
 * Columns per Axion's `LIstPreset`: Name, Domain (Show All only), Status (click-to-toggle pill, no
 * confirmation), Description, Actions (Edit / Copy / Delete — disabled, not hidden, without
 * permission). Sorting is client-side on the loaded page, as Axion's table does. Axion's
 * commented-out Extension column is not ported.
 */
const TimeGroupPresetTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canCopyRow,
  canDeleteRow,
  canToggleRow,
  pendingToggles,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggle,
  selectedRowKeys,
  onSelectionChange,
}: TimeGroupPresetTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<TimeGroupPreset>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  }

  /** Enabled / Disabled pill, styled like the sibling modules' status pills. */
  const renderStatus = (record: TimeGroupPreset) => {
    const isEnabled = record.enable
    const clickable = canToggleRow && !pendingToggles.has(record.preset_uuid)

    const toggle = () => {
      if (clickable) onToggle(record)
    }

    return (
      <StatusToggleTag
        enabled={isEnabled}
        tooltip={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}
        role="button"
        tabIndex={canToggleRow ? 0 : -1}
        aria-disabled={!clickable}
        aria-label={`Preset ${record.name} is ${isEnabled ? 'enabled' : 'disabled'}${canToggleRow ? ', click to toggle' : ''}`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        style={{ cursor: clickable ? 'pointer' : 'not-allowed', opacity: canToggleRow ? 1 : 0.6 }}
      >
        {isEnabled ? 'Enabled' : 'Disabled'}
      </StatusToggleTag>
    )
  }

  const columns: TableColumnsType<TimeGroupPreset> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: renderTruncated,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            width: 220,
            render: renderTruncated,
            sorter: (a: TimeGroupPreset, b: TimeGroupPreset) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: 'Status',
      key: 'enable',
      width: 130,
      render: (_, record) => renderStatus(record),
      sorter: (a, b) => Number(a.enable) - Number(b.enable),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: renderTruncated,
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
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
              aria-label={`Edit preset ${record.name}`}
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
              aria-label={`Copy preset ${record.name}`}
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
              aria-label={`Delete preset ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<TimeGroupPreset>
      rowKey="preset_uuid"
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
        showTotal: (count) => `${count} presets`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: showAll ? 1050 : 830 }}
      onRow={onRow}
    />
  )
}

export default TimeGroupPresetTable
