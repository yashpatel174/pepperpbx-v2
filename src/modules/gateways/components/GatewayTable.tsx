

import { Button, Space, Table, Tag, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { defaultPageSize, pageSizeOptions } from "../gateway.constants";
import type { Gateway } from "../gateway.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface GatewayTableProps {
  data: Gateway[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  canManage: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (gateway: Gateway) => void;
  onCopy: (gateway: Gateway) => void;
  onDelete: (gateway: Gateway) => void;
  onToggleEnabled: (gateway: Gateway) => void;
  onStartStop: (gateway: Gateway) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderOptionalText = (value?: string) =>
  value || <Text type="secondary">—</Text>;

// Client-side comparator for the sortable text columns (matches the Axion reference's
// tanstack sort: sorts the currently loaded/filtered page only, not a server-side sort).
const compareOptional = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

const GatewayTable = ({
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
  onCopy,
  onDelete,
  onToggleEnabled,
  onStartStop,
  selectedRowKeys,
  onSelectionChange,
}: GatewayTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<Gateway>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[]);
    },
  };

  const columns: TableColumnsType<Gateway> = [
    {
      title: "Gateway",
      dataIndex: "gateway",
      key: "gateway",
      width: 160,
      sorter: (a, b) => a.gateway.localeCompare(b.gateway),
    },

    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            render: renderOptionalText,
            sorter: (a: Gateway, b: Gateway) => a.domain.localeCompare(b.domain),
          },
        ]
      : []),

    {
      title: "Context",
      dataIndex: "context",
      key: "context",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.context, b.context),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.status, b.status),
    },

    {
      title: "Gateway Action",
      key: "gatewayAction",
      width: 130,

      // Only rendered when the gateway registers with a SIP server.
      // A non-registering gateway has no start/stop concept.
      render: (_, record) => {
        if (!record.register) {
          return <Text type="secondary">—</Text>;
        }

        const stopped = record.status === "Stopped";
        const actionColor = stopped ? token.colorSuccess : token.colorError;

        return (
          <Tag
            style={{
              cursor: "pointer",
              backgroundColor: actionColor,
              color: token.colorTextLightSolid,
              borderColor: actionColor,
              fontWeight: 500,
              borderRadius: "999px",
              padding: "4px 14px",
              minHeight: "28px",
              lineHeight: "20px",
            }}
            onClick={() => onStartStop(record)}
          >
            {stopped ? "Start" : "Stop"}
          </Tag>
        );
      },
    },

    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.state, b.state),
    },

    {
      title: "Hostname",
      dataIndex: "hostname",
      key: "hostname",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.hostname, b.hostname),
    },

    {
      title: "Enabled",
      key: "enabled",
      width: 120,
      render: (_, record) => {
        const isEnabled = record.enabled;
        const enabledColor = isEnabled ? token.colorSuccess : token.colorError;

        return (
          <Tooltip title={`Click to ${isEnabled ? "disable" : "enable"}`}>
            <Tag
              icon={isEnabled ? <CheckCircleOutlined /> : <MinusCircleOutlined />}
              style={{
                cursor: "pointer",
                backgroundColor: enabledColor,
                color: token.colorTextLightSolid,
                borderColor: enabledColor,
                fontWeight: 500,
                borderRadius: "999px",
                padding: "4px 14px",
                minHeight: "28px",
                lineHeight: "20px",
              }}
              onClick={() => onToggleEnabled(record)}
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </Tag>
          </Tooltip>
        );
      },
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value?: string) =>
        value ? (
          <Tooltip title={value}>{value}</Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
      sorter: (a, b) => compareOptional(a.description, b.description),
    },

    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="gateway.manage">
              once RBAC permissions are populated from the backend. */}

          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canManage}
              onClick={() => onEdit(record)}
              aria-label={`Edit gateway ${record.gateway}`}
            />
          </Tooltip>

          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canManage}
              onClick={() => onCopy(record)}
              aria-label={`Copy gateway ${record.gateway}`}
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
              aria-label={`Delete gateway ${record.gateway}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<Gateway>
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
        showTotal: (totalCount) => `${totalCount} gateways`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1100 }}
      onRow={onRow}
    />
  );
};

export default GatewayTable;

