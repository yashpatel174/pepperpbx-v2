import { Button, Space, Table, Tag, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined } from "@ant-design/icons";
import {
  defaultPageSize,
  destinationStatusLabels,
  pageSizeOptions,
  typeOptions,
} from "../destination.constants";
import type { Destination } from "../destination.types";
import useStripedTableRow from "../../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface DestinationTableProps {
  data: Destination[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  canManage: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (destination: Destination) => void;
  onCopy: (destination: Destination) => void;
  onDelete: (destination: Destination) => void;
  onToggleStatus: (destination: Destination) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderOptionalText = (value?: string) => value || <Text type="secondary">—</Text>;

const typeLabelByValue = Object.fromEntries(typeOptions.map((option) => [option.value, option.label]));

// Client-side comparators for the sortable columns below — matches the Axion reference's
// documented sorting behavior (destinations.md §3 item 8: column-header click sorts only the
// currently loaded/paginated page, via tanstack's client-side `sortable: true`; the list itself
// stays server-paginated, not server-sorted) and Gateways' own GatewayTable.tsx precedent for
// the same "client-side sort of the current page" approach.
const compareOptional = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

// Destination/Country Code are digit strings (phone numbers), not free text — a numeric compare
// reads more naturally than alphabetical (e.g. "77887" before "10884404" would be wrong
// alphabetically but is correct numerically). Missing values sort to the end either way.
const compareNumericString = (a?: string, b?: string) => {
  const numA = a ? Number(a) : NaN;
  const numB = b ? Number(b) : NaN;
  if (Number.isNaN(numA) && Number.isNaN(numB)) return 0;
  if (Number.isNaN(numA)) return 1;
  if (Number.isNaN(numB)) return -1;
  return numA - numB;
};

const DestinationTable = ({
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
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: DestinationTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<Destination>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[]);
    },
  };

  const columns: TableColumnsType<Destination> = [
    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            render: renderOptionalText,
            sorter: (a: Destination, b: Destination) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),

    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (type: Destination["type"]) => typeLabelByValue[type] ?? type,
      sorter: (a, b) => compareOptional(a.type, b.type),
    },

    {
      title: "Country Code",
      dataIndex: "prefix",
      key: "prefix",
      width: 130,
      render: renderOptionalText,
      sorter: (a, b) => compareNumericString(a.prefix, b.prefix),
    },

    {
      title: "Destination",
      dataIndex: "destination",
      key: "destination",
      width: 130,
      sorter: (a, b) => compareNumericString(a.destination, b.destination),
    },

    {
      title: "Destination Actions",
      dataIndex: "destinationActions",
      key: "destinationActions",
      render: (value?: string) =>
        value ? (
          <div style={{ maxWidth: 200, overflowX: "auto", whiteSpace: "nowrap" }}>{value}</div>
        ) : (
          <Text type="secondary">—</Text>
        ),
      sorter: (a, b) => compareOptional(a.destinationActions, b.destinationActions),
    },

    {
      title: "Context",
      dataIndex: "context",
      key: "context",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.context, b.context),
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.description, b.description),
    },

    /**
     * INTENTIONAL PEPPERPBX ENHANCEMENT: Axion documents this column as display-only
     * (destinations.md §5/§17/§26/§33) — enable/disable changeable only via the Edit form's
     * `destination_enabled` switch. PepperPBX deliberately makes it a clickable toggle instead,
     * matching Extensions' identical Status column (ExtensionTable.tsx — same styling, same
     * "click to enable/disable" behavior, no confirmation, see destination.service.ts's
     * setDestinationEnabled). This is a known, intentional product decision, not an unimplemented
     * Axion requirement — the Edit form's switch remains available as an alternate path too.
     */
    {
      title: "Status",
      key: "status",
      width: 130,
      sorter: (a, b) => Number(a.enabled) - Number(b.enabled),
      render: (_, record) => {
        const isEnabled = record.enabled;

        return (
          <Tooltip title={`Click to ${isEnabled ? "disable" : "enable"}`}>
            <Tag
              icon={
                isEnabled ? (
                  <CheckCircleOutlined style={{ color: "#fff" }} />
                ) : (
                  <MinusCircleOutlined style={{ color: "#fff" }} />
                )
              }
              style={{
                cursor: "pointer",
                backgroundColor: isEnabled ? "#00D27A" : "#f16b3e",
                color: "#fff",
                borderColor: isEnabled ? "#00D27A" : "#f16b3e",
                fontWeight: 500,
                borderRadius: "999px",
                padding: "4px 14px",
                minHeight: "28px",
                lineHeight: "20px",
              }}
              onClick={() => onToggleStatus(record)}
            >
              {destinationStatusLabels[isEnabled ? "enabled" : "disabled"]}
            </Tag>
          </Tooltip>
        );
      },
    },

    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="destination.edit"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canManage}
              onClick={() => onEdit(record)}
              aria-label={`Edit destination ${record.destination}`}
            />
          </Tooltip>

          {/* TODO: wrap with <PermissionGuard permission="destination.copy"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canManage}
              onClick={() => onCopy(record)}
              aria-label={`Copy destination ${record.destination}`}
            />
          </Tooltip>

          {/* TODO: wrap with <PermissionGuard permission="destination.delete"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canManage}
              onClick={() => onDelete(record)}
              aria-label={`Delete destination ${record.destination}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<Destination>
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
        showTotal: (totalCount) => `${totalCount} destinations`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1100 }}
      onRow={onRow}
    />
  );
};

export default DestinationTable;
