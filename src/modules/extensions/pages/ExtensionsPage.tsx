import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Select, Space, Switch, Tooltip, Typography } from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  UndoOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import ErrorState from "../../../components/feedback/ErrorState";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ModuleHeader from "../../../components/common/ModuleHeader";
import ConfirmActionModal from "../../../components/common/ConfirmActionModal";
import ExtensionFilters from "../components/ExtensionFilters";
import ExtensionTable from "../components/ExtensionTable";
import DeleteExtensionsModal from "../components/DeleteExtensionsModal";
import type { DeleteTarget } from "../components/DeleteExtensionsModal";
import CopyExtensionModal from "../components/CopyExtensionModal";
import { extensionStatusLabels } from "../extension.constants";
import { useExtensions } from "../useExtensions";
import useExtensionPermissions from "../useExtensionPermissions";
import type { Extension } from "../extension.types";
import { getApiErrorMessage } from "../../../services/api/apiError";

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
    commitSearch,
    setPage,
    setPageSize,
    setShowAll,
    resetFilters,
    refresh,
    deleteExtensions,
    bulkToggle,
    toggleExtensionStatus,
    copyExtension,
    getExportData,
  } = useExtensions();
  const { canCopy, canAdd, canManageAll } = useExtensionPermissions();

  const { message } = App.useApp();
  const navigate = useNavigate();

  // Selected extension rows (uuids — see Extension.id)
  const [selectedExtensionIds, setSelectedExtensionIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined);
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null);
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false);
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null);
  const [copyTarget, setCopyTarget] = useState<Extension | null>(null);

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

  const handleAdd = () => navigate("/account/extensions/add");

  const handleImport = () =>
    message.info("Extension import will be implemented next.");

  const handleEdit = (extension: Extension) =>
    navigate(`/account/extensions/${extension.id}/edit`);

  const handleCopyRequest = (extension: Extension) => setCopyTarget(extension);

  // Rejections propagate to CopyExtensionModal, which shows the error and stays open.
  const handleCopyConfirm = async (newExtension: string) => {
    if (!copyTarget) return;
    await copyExtension(copyTarget.id, newExtension);
    message.success(`Extension "${copyTarget.extension}" copied to "${newExtension}" successfully.`);
    setCopyTarget(null);
    clearSelection();
  };

  // Single-row delete now goes through the same DeleteExtensionsModal (and the same delete
  // service) as bulk delete — see extension.service.ts's deleteExtensions.
  const handleDeleteRequest = (extension: Extension) => {
    setDeleteIsBulk(false);
    setDeleteTargets([{ id: extension.id, extension: extension.extension }]);
  };

  const handleToggleStatus = async (extension: Extension) => {
    const target = extension.status !== "enabled";

    try {
      await toggleExtensionStatus(extension.id, target);

      message.success(
        `Extension "${extension.extension}" ${
          target ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err) {
      message.error(
        getApiErrorMessage(err, `Failed to update extension ${extension.extension}.`)
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
      setToggleTargetIds(eligibleIds);
      return;
    }

    if (bulkAction === "delete") {
      setDeleteIsBulk(true);
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
    message.success(ids.length === 1 ? `Extension "${deleteTargets[0].extension}" deleted successfully.` : `${ids.length} extensions deleted.`);
    setDeleteTargets(null);
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    setSelectedExtensionIds((selected) => selected.filter((id) => !ids.includes(id)));
    setDeleteIsBulk(false);
  };

  // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
  const handleDeleteCancel = () => {
    setDeleteTargets(null);
    if (deleteIsBulk) clearSelection();
    setDeleteIsBulk(false);
  };

  const handleToggleConfirm = async () => {
    if (!toggleTargetIds) return;
    await bulkToggle(toggleTargetIds);
    message.success(
      `${toggleTargetIds.length} extension${toggleTargetIds.length === 1 ? "" : "s"} toggled.`
    );
    setToggleTargetIds(null);
    clearSelection();
  };

  const handleToggleCancel = () => {
    setToggleTargetIds(null);
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
        // Add/Import/Export need the module-admin or add permission; Show All needs module-admin
        // (extension.md §14). All allowed while the permission store is unpopulated.
        primaryAction={
          canAdd
            ? {
                key: "add",
                // TODO: wrap with <PermissionGuard permission="extension.create"> once RBAC
                // permissions are populated from the backend (see CLAUDE.md section 11).
                label: "Add Extension",
                icon: <PlusOutlined />,
                onClick: handleAdd,
              }
            : undefined
        }
        actions={
          canAdd
            ? [
                {
                  key: "import",
                  label: "Import",
                  icon: <UploadOutlined />,
                  onClick: handleImport,
                },
                {
                  key: "export",
                  label: "Export",
                  icon: <DownloadOutlined />,
                  onClick: handleExport,
                },
              ]
            : undefined
        }
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>

            <ExtensionFilters
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={commitSearch}
            />

            {canManageAll && (
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
            )}
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
          canCopyRow={canCopy}
          onCopy={handleCopyRequest}
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

      <ConfirmActionModal
        open={!!toggleTargetIds}
        title="Toggle selected extensions?"
        confirmText="Toggle"
        errorMessage="Failed to toggle selected extensions."
        onConfirm={handleToggleConfirm}
        onCancel={handleToggleCancel}
      >
        <Typography.Paragraph>
          Do you really want to toggle the status of{" "}
          {toggleTargetIds?.length === 1 ? "this extension" : `these ${toggleTargetIds?.length ?? 0} extensions`}?
        </Typography.Paragraph>
      </ConfirmActionModal>

      <CopyExtensionModal
        open={!!copyTarget}
        target={copyTarget}
        onCopy={handleCopyConfirm}
        onCancel={() => setCopyTarget(null)}
      />
    </Space>
  );
};

export default ExtensionsPage;
