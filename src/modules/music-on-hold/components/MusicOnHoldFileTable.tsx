import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { uploadedDateFormat } from '../music-on-hold.constants'
import type { MohAudioFile } from '../music-on-hold.types'

const { Text } = Typography

interface MusicOnHoldFileTableProps {
  files: MohAudioFile[]
  canViewRow: boolean
  canDeleteRow: boolean
  onView: (file: MohAudioFile) => void
  onDelete: (file: MohAudioFile) => void
}

const SIZE_UNITS: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
/** `file_size` is a raw backend string (e.g. "2.4 MB"); sorting parses it, display never does. */
const sizeToBytes = (size: string): number => {
  const match = /^\s*([\d.]+)\s*([a-z]+)?/i.exec(size)
  if (!match) return 0
  return Number(match[1]) * (SIZE_UNITS[(match[2] ?? 'B').toUpperCase()] ?? 1)
}

/**
 * One category's audio files (music-on-hold.md §5). No pagination (the audited inner table shows
 * none), no row selection and no domain column; it scrolls horizontally inside its own container.
 */
const MusicOnHoldFileTable = ({ files, canViewRow, canDeleteRow, onView, onDelete }: MusicOnHoldFileTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<MohAudioFile> = [
    {
      title: 'Audio File Name',
      dataIndex: 'audio_name',
      key: 'audio_name',
      ellipsis: true,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
      sorter: (a, b) => a.audio_name.localeCompare(b.audio_name),
    },
    {
      title: 'File Size',
      dataIndex: 'file_size',
      key: 'file_size',
      sorter: (a, b) => sizeToBytes(a.file_size) - sizeToBytes(b.file_size),
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploaded',
      key: 'uploaded',
      render: (value: string) => (dayjs(value).isValid() ? dayjs(value).format(uploadedDateFormat) : <Text type="secondary">—</Text>),
      sorter: (a, b) => dayjs(a.uploaded).valueOf() - dayjs(b.uploaded).valueOf(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, file) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="music-on-hold.view"> once RBAC permissions are populated from the backend. */}
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canViewRow}
              onClick={() => onView(file)}
              aria-label={`View ${file.audio_name}`}
            />
          </Tooltip>
          {/* TODO: wrap with <PermissionGuard permission="music-on-hold.manage"> once RBAC permissions are populated from the backend. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(file)}
              aria-label={`Delete ${file.audio_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<MohAudioFile>
      rowKey="audio_name"
      size="small"
      showSorterTooltip={false}
      columns={columns}
      dataSource={files}
      onRow={onRow}
      pagination={false}
      locale={{ emptyText: 'No audio files in this category yet.' }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default MusicOnHoldFileTable
