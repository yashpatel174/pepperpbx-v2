import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { defaultPageSize, pageSizeOptions, voicemailStatusLabels } from '../voicemail.constants'
import type { Voicemail } from '../voicemail.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import StatusToggleTag from '../../../components/common/StatusToggleTag'

const { Text } = Typography

interface VoicemailTableProps {
  data: Voicemail[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  /** The Domain column is visible only in Show All mode (voicemail.md §4.4/§18). */
  showAll: boolean
  canEditRow: boolean
  canCopyRow: boolean
  canDeleteRow: boolean
  /** Gates the inline Status button (voicemail.md §7/§19). */
  canToggleRow: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (voicemail: Voicemail) => void
  onCopy: (voicemail: Voicemail) => void
  onDelete: (voicemail: Voicemail) => void
  onToggleStatus: (voicemail: Voicemail) => void
  /** Inline Attached / Keep Local / Transcribe pills — gated by `canToggleRow`, like Status. */
  onToggleAttached: (voicemail: Voicemail) => void
  onToggleKeepLocal: (voicemail: Voicemail) => void
  onToggleTranscription: (voicemail: Voicemail) => void
  onOpenMessages: (voicemail: Voicemail) => void
  onOpenGreetings: (voicemail: Voicemail) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')
/** Numeric-aware text compare — keeps "30" < "200" < "1000" (IDs are strings, possibly `**`-prefixed). */
const compareNumericText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '', undefined, { numeric: true })
const compareBool = (a: boolean, b: boolean) => Number(a) - Number(b)

const renderOptionalText = (value?: string) => (value ? value : <Text type="secondary">—</Text>)

const VoicemailTable = ({
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
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  onToggleAttached,
  onToggleKeepLocal,
  onToggleTranscription,
  onOpenMessages,
  onOpenGreetings,
  selectedRowKeys,
  onSelectionChange,
}: VoicemailTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  // Selection persists across pages (preserveSelectedRowKeys keeps keys that aren't in the
  // currently rendered page); the page owns the full selected-id list.
  const rowSelection: TableProps<Voicemail>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => onSelectionChange(selectedKeys as string[]),
  }

  /** Clickable Enabled/Disabled pill — same look, tooltip and disabled treatment as the Status column. */
  const renderToggleFlag = (record: Voicemail, isEnabled: boolean, onToggle: (voicemail: Voicemail) => void) => (
    <StatusToggleTag
      enabled={isEnabled}
      tooltip={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}
      iconStyle={{ color: token.colorWhite }}
      style={{ cursor: canToggleRow ? 'pointer' : 'not-allowed', opacity: canToggleRow ? 1 : 0.6 }}
      onClick={() => canToggleRow && onToggle(record)}
    >
      {voicemailStatusLabels[isEnabled ? 'enabled' : 'disabled']}
    </StatusToggleTag>
  )

  const columns: TableColumnsType<Voicemail> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            sorter: (a: Voicemail, b: Voicemail) => compareText(a.domain_name, b.domain_name),
          },
        ]
      : []),

    {
      title: 'Voicemail ID',
      dataIndex: 'voicemail_id',
      key: 'voicemail_id',
      sorter: (a, b) => compareNumericText(a.voicemail_id, b.voicemail_id),
    },

    {
      title: 'Mail To',
      dataIndex: 'voicemail_mail_to',
      key: 'voicemail_mail_to',
      render: renderOptionalText,
      sorter: (a, b) => compareText(a.voicemail_mail_to, b.voicemail_mail_to),
    },

    {
      // Axion compares `voicemail_file === true` (a boolean) against a field that holds
      // attach/listen_link/download_link, so it can never show Enabled (voicemail.md §24). Here
      // "Attached" means the email carries the audio file — i.e. the `attach` mode.
      title: 'Attached',
      dataIndex: 'voicemail_file',
      key: 'voicemail_file',
      render: (_, record) => renderToggleFlag(record, record.voicemail_file === 'attach', onToggleAttached),
      sorter: (a, b) => compareText(a.voicemail_file, b.voicemail_file),
    },

    {
      title: 'Keep Local',
      dataIndex: 'voicemail_local_after_email',
      key: 'voicemail_local_after_email',
      render: (_, record) => renderToggleFlag(record, record.voicemail_local_after_email, onToggleKeepLocal),
      sorter: (a, b) => compareBool(a.voicemail_local_after_email, b.voicemail_local_after_email),
    },

    {
      title: 'Transcribe',
      dataIndex: 'voicemail_transcription_enabled',
      key: 'voicemail_transcription_enabled',
      render: (_, record) => renderToggleFlag(record, record.voicemail_transcription_enabled, onToggleTranscription),
      sorter: (a, b) => compareBool(a.voicemail_transcription_enabled, b.voicemail_transcription_enabled),
    },

  {
  title: 'Tools',
  key: 'tools',
  render: (_, record) => (
    <Space size="small">
      <Button
        type="primary"
        shape="round"
        style={{
          padding: '4px 14px',
          minHeight: '28px',
          lineHeight: '20px',
          fontWeight: 500,
        }}
        onClick={() => onOpenMessages(record)}
        aria-label={`Messages for voicemail ${record.voicemail_id}`}
      >
        Messages ({record.total_messages})
      </Button>

      <Button
        type="primary"
        shape="round"
        style={{
          padding: '4px 14px',
          minHeight: '28px',
          lineHeight: '20px',
          fontWeight: 500,
        }}
        onClick={() => onOpenGreetings(record)}
        aria-label={`Greetings for voicemail ${record.voicemail_id}`}
      >
        Greetings ({record.total_greetings})
      </Button>
    </Space>
  ),
},

    {
      title: 'Status',
      key: 'status',
      width: 130,
      sorter: (a, b) => compareBool(a.voicemail_enabled, b.voicemail_enabled),
      render: (_, record) => {
        // The default mailbox renders no Status button at all (voicemail.md §7).
        if (record.default) return null
        const isEnabled = record.voicemail_enabled
        return (
          <StatusToggleTag
            enabled={isEnabled}
            tooltip={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}
            iconStyle={{ color: token.colorWhite }}
            style={{ cursor: canToggleRow ? 'pointer' : 'not-allowed', opacity: canToggleRow ? 1 : 0.6 }}
            onClick={() => canToggleRow && onToggleStatus(record)}
          >
            {voicemailStatusLabels[isEnabled ? 'enabled' : 'disabled']}
          </StatusToggleTag>
        )
      },
    },

    {
      title: 'Description',
      dataIndex: 'voicemail_description',
      key: 'voicemail_description',
      width: 200,
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareText(a.voicemail_description, b.voicemail_description),
    },

    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="voicemail.edit"> once RBAC permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit voicemail ${record.voicemail_id}`}
            />
          </Tooltip>

          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy voicemail ${record.voicemail_id}`}
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
              aria-label={`Delete voicemail ${record.voicemail_id}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<Voicemail>
      rowKey="voicemail_uuid"
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
        locale: { items_per_page: 'per page' },
        showTotal: (totalCount) => `${totalCount} voicemails`,
        onChange: (nextPage, nextSize) => {
          if (nextSize !== pageSize) onPageSizeChange(nextSize)
          else onPageChange(nextPage)
        },
      }}
      scroll={{ x: 'max-content' }}
      onRow={onRow}
    />
  )
}

export default VoicemailTable
