import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Select, Space, Switch, Tooltip, Typography } from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import ErrorState from "../../../components/feedback/ErrorState";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ModuleHeader from "../../../components/common/ModuleHeader";
import ExtensionFilters from "../components/ExtensionFilters";
import ExtensionTable from "../components/ExtensionTable";
import DeleteExtensionsModal from "../components/DeleteExtensionsModal";
import type { DeleteTarget } from "../components/DeleteExtensionsModal";
import { extensionStatusLabels } from "../extension.constants";
import { useExtensions } from "../useExtensions";
import type { Extension } from "../extension.types";

type BulkAction = "toggle" | "delete";

const escapeCsvValue = (value: string) =>
  /[",\n]/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;

const exportExtensionsToCsv = (extensions: Extension[]) => {
  const headers = [
    "Extension",
    "Effective Caller ID Name",
    "Outbound Caller ID Name",
    "Call Group",
    "Domain",
    "Description",
    "Status",
  ];

  const rows = extensions.map((ext) => [
    ext.extension,
    ext.effectiveCallerIdName ?? "",
    ext.outboundCallerIdName ?? "",
    ext.callGroup ?? "",
    ext.domain,
    ext.description ?? "",
    extensionStatusLabels[ext.status],
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `extensions-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const ExtensionsPage = () => {
  const {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm,
    setSearchTerm,
    setPage,
    setPageSize,
    setShowAll,
    refresh,
    deleteExtensions,
    bulkToggle,
    toggleExtensionStatus,
    duplicateExtension,
    getExportData,
  } = useExtensions();

  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Selected extension rows (uuids — see Extension.id)
  const [selectedExtensionIds, setSelectedExtensionIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined);
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null);

  const hasSelection = selectedExtensionIds.length > 0;

  // Selection can be cleared by deselecting rows directly (not just via a completed/cancelled
  // bulk action) — reset the chosen action too so a later re-selection doesn't show a stale one.
  useEffect(() => {
    if (selectedExtensionIds.length === 0) setBulkAction(undefined);
  }, [selectedExtensionIds]);

  // Accumulates extension-number labels across every page this session has fetched (reusing the
  // same `data` the table already renders — no extra request). A row can only ever be selected
  // after appearing in `data` at least once, so by the time a bulk delete is confirmed, every
  // selected id's label is already known here even if that row's page isn't the one currently
  // loaded — fixing the "shows ext-106 instead of 106" cross-page display issue without falling
  // back to the raw id unless a record was genuinely never fetched this session.
  const extensionLabelByIdRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    data.forEach((extension) => {
      extensionLabelByIdRef.current.set(extension.id, extension.extension);
    });
  }, [data]);

  const clearSelection = () => {
    setSelectedExtensionIds([]);
    setBulkAction(undefined);
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdd = () => navigate("/account/extensions/add");

  const handleImport = () =>
    message.info("Extension import will be implemented next.");

  const handleEdit = (extension: Extension) =>
    navigate(`/account/extensions/${extension.id}/edit`);

  const handleDuplicate = (extension: Extension) => {
    duplicateExtension(extension.id);
    message.success(`Extension ${extension.extension} duplicated.`);
  };

  // Single-row delete now goes through the same DeleteExtensionsModal (and the same delete
  // service) as bulk delete — see extension.service.ts's deleteExtensions.
  const handleDeleteRequest = (extension: Extension) => {
    setDeleteTargets([{ id: extension.id, extension: extension.extension }]);
  };

  const handleToggleStatus = async (extension: Extension) => {
    const target = extension.status !== "enabled";

    try {
      await toggleExtensionStatus(extension.id, target);

      message.success(
        `Extension ${extension.extension} ${
          target ? "enabled" : "disabled"
        }.`
      );
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : `Failed to update extension ${extension.extension}.`
      );
    }
  };

  // Exports the full search-filtered set (all domains, all pages), matching what a
  // Show All view would display.
  const handleExport = async () => {
    const rows = await getExportData();

    if (rows.length === 0) {
      message.warning("No extensions to export.");
      return;
    }

    exportExtensionsToCsv(rows);
  };

  // Rows selected on the current page whose `default` (protected/system) flag is known —
  // cross-page selections can't be checked client-side without fetching them, so those ids
  // are passed through and rely on the service's own defensive skip (see extension.service.ts).
  const getEligibleSelectedIds = () => {
    const protectedIds = new Set(data.filter((extension) => extension.default).map((extension) => extension.id));
    return selectedExtensionIds.filter((id) => !protectedIds.has(id));
  };

  const handleApplyBulkAction = () => {
    const eligibleIds = getEligibleSelectedIds();
    if (eligibleIds.length === 0) {
      message.warning("No eligible extensions selected.");
      return;
    }

    if (bulkAction === "toggle") {
      const count = eligibleIds.length;
      modal.confirm({
        title: "Toggle selected extensions?",
        content: `Do you really want to toggle the status of ${count === 1 ? "this extension" : `these ${count} extensions`}?`,
        okText: "Toggle",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await bulkToggle(eligibleIds);
            message.success(
              `${eligibleIds.length} extension${eligibleIds.length === 1 ? "" : "s"} toggled.`
            );
          } catch (err) {
            message.error(err instanceof Error ? err.message : "Failed to toggle selected extensions.");
          } finally {
            clearSelection();
          }
        },
        onCancel: () => clearSelection(),
      });
      return;
    }

    if (bulkAction === "delete") {
      // Row selection is preserved across pages, so eligibleIds can include ids from a page that
      // isn't currently loaded in `data`. The delete targets must come from eligibleIds itself,
      // not from filtering `data` — otherwise ids selected on another page would be silently
      // dropped from the delete. The friendly label comes from extensionLabelByIdRef (accumulated
      // across every page fetched this session, see above), falling back to the raw id only if a
      // selected extension was somehow never fetched.
      setDeleteTargets(eligibleIds.map((id) => ({ id, extension: extensionLabelByIdRef.current.get(id) ?? id })));
    }
  };

  const handleDeleteConfirm = async (deleteVoicemail: boolean) => {
    if (!deleteTargets) return;
    const ids = deleteTargets.map((target) => target.id);
    await deleteExtensions(ids, deleteVoicemail);
    message.success(`${ids.length} extension${ids.length === 1 ? "" : "s"} deleted.`);
    setDeleteTargets(null);
    clearSelection();
  };

  const handleDeleteCancel = () => {
    setDeleteTargets(null);
    clearSelection();
  };

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>
        You have selected {selectedExtensionIds.length} rows
      </Typography.Text>

      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: "toggle", label: "Toggle" },
          { value: "delete", label: "Delete" },
        ]}
        aria-label="Select action"
      />

      <Button type="primary" disabled={!bulkAction} onClick={handleApplyBulkAction}>
        Apply
      </Button>
    </Space>
  );

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />;
  }

  return (
    <Space
      orientation="vertical"
      size="middle"
      style={{ width: "100%" }}
    >
      <ModuleHeader
        title="Extensions"
        count={totalRecords}
        primaryAction={{
          key: "add",
          // TODO: wrap with <PermissionGuard permission="extension.create"> once RBAC
          // permissions are populated from the backend (see CLAUDE.md section 11).
          label: "Add Extension",
          icon: <PlusOutlined />,
          onClick: handleAdd,
        }}
        actions={[
          {
            key: "import",
            label: "Import",
            icon: <DownloadOutlined />,
            onClick: handleImport,
          },
          {
            key: "export",
            label: "Export",
            icon: <UploadOutlined />,
            onClick: handleExport,
          },
        ]}
        filters={
          <>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                aria-label="Refresh extensions"
              />
            </Tooltip>

            <ExtensionFilters
              value={searchTerm}
              onChange={setSearchTerm}
            />

            <Tooltip title="Show extensions across all accessible domains">
              <Space size="small">
                <Switch
                  checked={showAll}
                  onChange={setShowAll}
                  size="small"
                  aria-label="Show all extensions"
                />
                <span>Show All</span>
              </Space>
            </Tooltip>
          </>
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {totalRecords === 0 ? (
        <EmptyState
          description={
            searchTerm
              ? "No extensions match your search."
              : "No extensions found."
          }
        />
      ) : (
        <ExtensionTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedExtensionIds}
          onSelectionChange={setSelectedExtensionIds}
        />
      )}

      <DeleteExtensionsModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Space>
  );
};

export default ExtensionsPage;
