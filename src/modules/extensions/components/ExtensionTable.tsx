import { Button, Space, Table, Tag, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { defaultPageSize, extensionStatusLabels, pageSizeOptions } from "../extension.constants";
import type { Extension, ExtensionStatus } from "../extension.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface ExtensionTableProps {
  data: Extension[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (extension: Extension) => void;
  onDuplicate: (extension: Extension) => void;
  onDelete: (extension: Extension) => void;
  onToggleStatus: (extension: Extension) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderOptionalText = (value?: string) => value || <Text type="secondary">—</Text>;

const ExtensionTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: ExtensionTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<Extension>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    // Protected/system records (Extension.default) can never be part of a bulk action —
    // see ExtensionsPage's Select Action flow and extension.service.ts's toggleExtensions/
    // deleteExtensions, which defensively skip them too.
    getCheckboxProps: (record) => ({ disabled: !!record.default }),
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[]);
    },
  };

  const columns: TableColumnsType<Extension> = [
    {
      title: "Extension",
      dataIndex: "extension",
      key: "extension",
      width: 120,
    },

    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            render: renderOptionalText,
          },
        ]
      : []),

    {
      title: "Effective Caller ID Name",
      dataIndex: "effectiveCallerIdName",
      key: "effectiveCallerIdName",
      render: renderOptionalText,
    },

    {
      title: "Outbound Caller ID Name",
      dataIndex: "outboundCallerIdName",
      key: "outboundCallerIdName",
      render: renderOptionalText,
    },

    {
      title: "Call Group",
      dataIndex: "callGroup",
      key: "callGroup",
      render: renderOptionalText,
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: renderOptionalText,
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: ExtensionStatus, record) => {
        const isEnabled = status === "enabled";

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
              {extensionStatusLabels[status]}
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
          {/* TODO: wrap with <PermissionGuard permission="extension.update"> once RBAC
              permissions are populated from the backend (see CLAUDE.md section 11). */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => onEdit(record)}
              aria-label={`Edit extension ${record.extension}`}
            />
          </Tooltip>

          <Tooltip title="Duplicate">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              onClick={() => onDuplicate(record)}
              aria-label={`Duplicate extension ${record.extension}`}
            />
          </Tooltip>

          {/* TODO: wrap with <PermissionGuard permission="extension.delete"> once RBAC
              permissions are populated from the backend (see CLAUDE.md section 11).
              Confirmation now happens via DeleteExtensionsModal, opened by the page —
              it also offers the Extension+Voicemail / Extension-Only choice, so a plain
              Popconfirm here would be a second, inconsistent confirmation UX. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              aria-label={`Delete extension ${record.extension}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<Extension>
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
        showTotal: (totalCount) => `${totalCount} extensions`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 960 }}
      onRow={onRow}
    />
  );
};

export default ExtensionTable;
