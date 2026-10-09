import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import EmptyState from '../../../components/feedback/EmptyState'
import ImportMatchForm from '../components/ImportMatchForm'
import { createImportMatch } from '../voicemail.service'
import type { ImportVoicemailResult } from '../voicemail.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const IMPORT_MATCH_FORM_ID = 'import-match-voicemail-form'

/**
 * Import step two (voicemail.md §16). Reached only by navigating from the Import popup with its
 * result in router state; without it the page shows an EmptyState with a way back rather than a
 * broken form (Axion shows a 403 "Error while import file" panel here).
 */
const ImportMatchVoicemailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  const result = (location.state as { result?: ImportVoicemailResult } | null)?.result

  const handleBack = () => navigate('/voicemail')

  const handleSubmit = async (mapField: Record<string, string>) => {
    if (!result) return
    setSubmitting(true)
    try {
      const importInfo = await createImportMatch(result.csvId, mapField)
      navigate('/voicemail', { state: { importInfo } })
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to import voicemails.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!result) {
    return (
      <EmptyState
        description="Error while import file, please try again..."
        action={<Button onClick={handleBack}>Back to Voicemail</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Import Voicemail"
        toolbar={
          <FormPageToolbar onBack={handleBack}>
            <Button onClick={handleBack} disabled={submitting}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" form={IMPORT_MATCH_FORM_ID} loading={submitting}>
              Import
            </Button>
          </FormPageToolbar>
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

export default ImportMatchVoicemailPage
