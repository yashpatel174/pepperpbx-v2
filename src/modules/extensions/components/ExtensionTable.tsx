import { useState } from 'react'
import type { Key } from 'react'
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { defaultPageSize, extensionStatusLabels, extensionStatusTagColor } from '../extension.constants'
import type { Extension, ExtensionStatus } from '../extension.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'

const { Text } = Typography

interface ExtensionTableProps {
  data: Extension[]
  loading: boolean
  showAll: boolean
  onEdit: (extension: Extension) => void
  onDuplicate: (extension: Extension) => void
  onDelete: (extension: Extension) => void
}

const renderOptionalText = (value?: string) =>
  value || <Text type="secondary">—</Text>

const ExtensionTable = ({ data, loading, showAll, onEdit, onDuplicate, onDelete }: ExtensionTableProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const onRow = useStripedTableRow()

  const rowSelection: TableProps<Extension>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  const columns: TableColumnsType<Extension> = [
    {
      title: 'Extension',
      dataIndex: 'extension',
      key: 'extension',
      width: 120,
    },
    {
      title: 'Effective Caller ID Name',
      dataIndex: 'effectiveCallerIdName',
      key: 'effectiveCallerIdName',
      render: renderOptionalText,
    },
    {
      title: 'Outbound Caller ID Name',
      dataIndex: 'outboundCallerIdName',
      key: 'outboundCallerIdName',
      render: renderOptionalText,
    },
    {
      title: 'Call Group',
      dataIndex: 'callGroup',
      key: 'callGroup',
      render: renderOptionalText,
    },
    {
      title: 'Context',
      dataIndex: 'context',
      key: 'context',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: renderOptionalText,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ExtensionStatus) => (
        <Tag
          color={extensionStatusTagColor[status]}
          icon={status === 'enabled' ? <CheckCircleOutlined /> : <MinusCircleOutlined />}
        >
          {extensionStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="extension.update"> once RBAC
              permissions are populated from the backend (see CLAUDE.md section 11). */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              aria-label={`Edit extension ${record.extension}`}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onDuplicate(record)}
              aria-label={`Duplicate extension ${record.extension}`}
            />
          </Tooltip>
          {/* TODO: wrap with <PermissionGuard permission="extension.delete"> once RBAC
              permissions are populated from the backend (see CLAUDE.md section 11). */}
          <Popconfirm
            title="Delete this extension?"
            description={`Extension ${record.extension} will be removed.`}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(record)}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Delete extension ${record.extension}`}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table<Extension>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      pagination={showAll ? false : { pageSize: defaultPageSize, showSizeChanger: true, showTotal: (total) => `${total} extensions` }}
      scroll={{ x: 960 }}
      onRow={onRow}
    />
  )
}

export default ExtensionTable
