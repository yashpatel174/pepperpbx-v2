import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import EmptyState from '../../../../components/feedback/EmptyState'
import ImportMatchForm from '../components/ImportMatchForm'
import { createImportMatch } from '../destination.service'
import type { ImportDestinationResult } from '../destination.types'

const IMPORT_MATCH_FORM_ID = 'import-match-destination-form'

/**
 * Import-match step — reached only by navigating from the Import popup with its result in
 * router state (destinations.md §3's Import-match flow). There is no direct nav entry and no
 * standalone way to "browse" here, matching the Axion reference; a bad/missing state renders
 * an EmptyState with a back action rather than a broken form.
 */
const ImportMatchDestinationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  const result = (location.state as { result?: ImportDestinationResult } | null)?.result

  const handleBackToList = () => navigate('/dialplans/destinations')

  const handleSubmit = async (mapField: Record<string, string>) => {
    if (!result) return
    setSubmitting(true)
    try {
      const summary = await createImportMatch(result.csvId, mapField)
      message.success(`Import complete: ${summary.imported} imported, ${summary.skipped} skipped.`)
      navigate('/dialplans/destinations', { state: { importSummary: summary } })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to submit field mapping.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!result) {
    return (
      <EmptyState
        description="Import data not found. Please import a CSV file again."
        action={<Button onClick={handleBackToList}>Back to Destinations</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Import Destinations — Match Fields"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
              Back
            </Button>
            <Space>
              <Button onClick={handleBackToList} disabled={submitting}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" form={IMPORT_MATCH_FORM_ID} loading={submitting}>
                Import
              </Button>
            </Space>
          </div>
        }
      />
      <ImportMatchForm
        formId={IMPORT_MATCH_FORM_ID}
        matchedFields={result.matchedFields}
        unmatchedDbFields={result.unmatchedDbFields}
        csvColumns={result.csvColumns}
        rowCount={result.rowCount}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default ImportMatchDestinationPage
