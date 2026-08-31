import { useState } from 'react'
import { App, Button, Space, Switch, Tooltip } from 'antd'
import { DownloadOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import ErrorState from '../../components/feedback/ErrorState'
import LoadingState from '../../components/feedback/LoadingState'
import EmptyState from '../../components/feedback/EmptyState'
import ModuleHeader from '../../components/common/ModuleHeader'
import ExtensionFilters from './components/ExtensionFilters'
import ExtensionTable from './components/ExtensionTable'
import { extensionStatusLabels } from './extension.constants'
import { useExtensions } from './useExtensions'
import type { Extension } from './extension.types'

const escapeCsvValue = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

const exportExtensionsToCsv = (extensions: Extension[]) => {
  const headers = ['Extension', 'Effective Caller ID Name', 'Outbound Caller ID Name', 'Call Group', 'Context', 'Description', 'Status']
  const rows = extensions.map((ext) => [
    ext.extension,
    ext.effectiveCallerIdName ?? '',
    ext.outboundCallerIdName ?? '',
    ext.callGroup ?? '',
    ext.context,
    ext.description ?? '',
    extensionStatusLabels[ext.status],
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `extensions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const ExtensionsPage = () => {
  const {
    data,
    filteredData,
    loading,
    error,
    refresh,
    removeExtension,
    duplicateExtension,
    searchTerm,
    setSearchTerm,
  } = useExtensions()
  const { message } = App.useApp()
  const [showAll, setShowAll] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const handleAdd = () => message.info('Extension creation will be implemented next.')
  const handleImport = () => message.info('Extension import will be implemented next.')
  const handleEdit = (extension: Extension) =>
    message.info(`Editing extension ${extension.extension} will be implemented next.`)

  const handleDuplicate = (extension: Extension) => {
    duplicateExtension(extension.id)
    message.success(`Extension ${extension.extension} duplicated.`)
  }

  const handleDelete = (extension: Extension) => {
    removeExtension(extension.id)
    message.success(`Extension ${extension.extension} deleted.`)
  }

  // Exports the currently visible (search-filtered) set, matching what the table shows.
  const handleExport = () => {
    if (filteredData.length === 0) {
      message.warning('No extensions to export.')
      return
    }
    exportExtensionsToCsv(filteredData)
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Extensions"
        count={data.length}
        primaryAction={{
          key: 'add',
          // TODO: wrap with <PermissionGuard permission="extension.create"> once RBAC
          // permissions are populated from the backend (see CLAUDE.md section 11).
          label: 'Add Extension',
          icon: <PlusOutlined />,
          onClick: handleAdd,
        }}
        actions={[
          { key: 'export', label: 'Export', icon: <DownloadOutlined />, onClick: handleExport },
          { key: 'import', label: 'Import', icon: <UploadOutlined />, onClick: handleImport },
        ]}
        filters={
          <>
            <Tooltip title="Show every extension on one page">
              <Space size="small">
                <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all extensions" />
                <span>Show All</span>
              </Space>
            </Tooltip>
            <ExtensionFilters value={searchTerm} onChange={setSearchTerm} />
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing} aria-label="Refresh extensions" />
            </Tooltip>
          </>
        }
      />
      {filteredData.length === 0 ? (
        <EmptyState description={searchTerm ? 'No extensions match your search.' : 'No extensions found.'} />
      ) : (
        <ExtensionTable
          data={filteredData}
          loading={loading}
          showAll={showAll}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}
    </Space>
  )
}

export default ExtensionsPage
