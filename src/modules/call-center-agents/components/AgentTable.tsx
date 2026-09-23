import { Button, Space, Table, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { agentStatusLabel, defaultPageSize, pageSizeOptions } from "../call-center-agents.constants";
import type { CallCenterAgent } from "../call-center-agents.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface AgentTableProps {
  data: CallCenterAgent[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  canManage: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (agent: CallCenterAgent) => void;
  onDelete: (agent: CallCenterAgent) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderOptionalText = (value?: string) => value || <Text type="secondary">—</Text>;

const compareOptional = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

/** Read-only status indicator — status is edited only via the dedicated Agent Status page
 * (call-center.md §16/§17); the list's own Status column has no confirmed inline-edit behavior in
 * the audit, so it's deliberately not made clickable here (see call-center.md §37's warning
 * against inventing an unconfirmed status toggle). */

const AgentTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canManage,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  selectedRowKeys,
  onSelectionChange,
}: AgentTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<CallCenterAgent>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[]);
    },
  };

  const columns: TableColumnsType<CallCenterAgent> = [
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },

    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            render: renderOptionalText,
            sorter: (a: CallCenterAgent, b: CallCenterAgent) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),

    {
      title: "Agent ID",
      dataIndex: "agentId",
      key: "agentId",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.agentId, b.agentId),
    },

    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.type, b.type),
    },

    {
      title: "Call Timeout",
      dataIndex: "callTimeout",
      key: "callTimeout",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.callTimeout, b.callTimeout),
    },

    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.contact, b.contact),
    },

    {
      title: "Max No Answer",
      dataIndex: "maxNoAnswer",
      key: "maxNoAnswer",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.maxNoAnswer, b.maxNoAnswer),
    },

    {
      title: "Status",
      key: "status",
      sorter: (a, b) => compareOptional(a.status, b.status),
      render: (_, record) => (record.status ? agentStatusLabel(record.status) : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="callCenterAgent.manage"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canManage}
              onClick={() => onEdit(record)}
              aria-label={`Edit call center agent ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canManage}
              onClick={() => onDelete(record)}
              aria-label={`Delete call center agent ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<CallCenterAgent>
      rowKey="id"
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
        showTotal: (totalCount) => `${totalCount} call center agents`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1200 }}
      onRow={onRow}
    />
  );
};

export default AgentTable;
