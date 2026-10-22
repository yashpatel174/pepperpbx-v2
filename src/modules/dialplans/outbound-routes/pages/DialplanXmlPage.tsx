import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, InputNumber, Modal, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, FieldNumberOutlined, SaveOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import LoadingState from '../../../../components/feedback/LoadingState'
import EmptyState from '../../../../components/feedback/EmptyState'
import ErrorState from '../../../../components/feedback/ErrorState'
import OutboundRouteXmlEditor from '../components/OutboundRouteXmlEditor'
import type { OutboundRouteXmlEditorHandle } from '../components/OutboundRouteXmlEditor'
import { getOutboundRouteXml, updateOutboundRouteXml } from '../outbound-route.service'
import { getApiErrorMessage } from '../../../../services/api/apiError'

const fontSizeOptions = [12, 14, 16, 18, 20, 22, 24, 26].map((size) => ({ label: `${size}px`, value: size }))

const DEFAULT_FONT_SIZE = 16

/**
 * Raw dialplan-XML editor — "Dialplan Manager XML" — a separate route/screen per the audit
 * (outbound-routes.md §3/§4/§25), reached only from the Edit page's XML button, both Save and
 * Back returning to Edit (never the List). Identified by this module's own `:routeId` route
 * param, matching Edit's convention — not Axion's `dialplan_uuids` query string.
 *
 * The audit gates this whole screen to Axion-only users (`pbx_axiontech` via `onlyAxionTech`) —
 * RBAC is foundation-only in PepperPBX (see CLAUDE.md's RBAC section), so no active permission
 * check gates this route today; see the TODO below.
 */
const DialplanXmlPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { routeId } = useParams<{ routeId: string }>()
  const editorRef = useRef<OutboundRouteXmlEditorHandle>(null)

  const [xml, setXml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showInvisibles, setShowInvisibles] = useState(false)
  const [showIndentGuides, setShowIndentGuides] = useState(false)

  const [gotoLineOpen, setGotoLineOpen] = useState(false)
  const [gotoLineValue, setGotoLineValue] = useState<number | null>(null)
  const [gotoLineTotal, setGotoLineTotal] = useState(0)
  const [gotoLineError, setGotoLineError] = useState<string | null>(null)

  const backToEdit = useCallback(() => {
    if (routeId) navigate(`/dialplans/outbound-routes/${routeId}/edit`)
    else navigate('/dialplans/outbound-routes')
  }, [navigate, routeId])

  const load = useCallback(() => {
    if (!routeId) return
    setLoading(true)
    setError(null)
    getOutboundRouteXml(routeId)
      .then((result) => setXml(result.xml))
      .catch(() => setError('Failed to load the dialplan XML for this outbound route.'))
      .finally(() => setLoading(false))
  }, [routeId])

  useEffect(() => {
    // A missing route id (unreachable via this route's own URL shape, but defensive all the
    // same) falls back to the List.
    if (!routeId) {
      navigate('/dialplans/outbound-routes')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  const handleSave = async () => {
    if (!routeId || xml === null) return
    setSaving(true)
    try {
      await updateOutboundRouteXml(routeId, xml)
      message.success('Dialplan XML saved.')
      // Matches the audit: Save returns to Edit, not the List (outbound-routes.md §3/§19).
      backToEdit()
    } catch (err) {
      // Stay on the page and keep the current editor content — never lose an in-progress edit
      // on a failed save.
      message.error(getApiErrorMessage(err, 'Failed to save the dialplan XML.'))
    } finally {
      setSaving(false)
    }
  }

  const handleOpenGotoLine = () => {
    setGotoLineTotal(editorRef.current?.getLineCount() ?? 0)
    setGotoLineValue(null)
    setGotoLineError(null)
    setGotoLineOpen(true)
  }

  const handleGotoLineConfirm = () => {
    if (gotoLineValue === null || !Number.isInteger(gotoLineValue) || gotoLineValue < 1) {
      setGotoLineError('Enter a valid positive line number.')
      return
    }
    const moved = editorRef.current?.gotoLine(gotoLineValue) ?? false
    if (!moved) {
      setGotoLineError(`Line must be between 1 and ${gotoLineTotal}.`)
      return
    }
    setGotoLineOpen(false)
  }

  if (error) {
    return (
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <ErrorState message={error} onRetry={load} />
        <Button icon={<ArrowLeftOutlined />} onClick={backToEdit}>
          Back to Edit
        </Button>
      </Space>
    )
  }

  if (loading) {
    return <LoadingState rows={16} />
  }

  if (xml === null) {
    return (
      <EmptyState
        description="No XML Found."
        action={
          <Button icon={<ArrowLeftOutlined />} onClick={backToEdit}>
            Back to Edit
          </Button>
        }
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Dialplan Manager XML"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={backToEdit} disabled={saving}>
              Back
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Save
            </Button>
          </div>
        }
      />

      <Space wrap size="middle" style={{ width: '100%' }}>
        <Space size="small">
          <Typography.Text>Font Size</Typography.Text>
          <Select
            value={fontSize}
            onChange={setFontSize}
            options={fontSizeOptions}
            style={{ width: 90 }}
            aria-label="Font size"
          />
        </Space>

        <Tooltip title="Move the cursor to a specific line">
          <Button icon={<FieldNumberOutlined />} onClick={handleOpenGotoLine}>
            Go to Line
          </Button>
        </Tooltip>

        <Space size="small">
          <Typography.Text>Line Numbers</Typography.Text>
          <Switch checked={showLineNumbers} onChange={setShowLineNumbers} aria-label="Show line numbers" />
        </Space>

        <Space size="small">
          <Typography.Text>Invisibles</Typography.Text>
          <Switch checked={showInvisibles} onChange={setShowInvisibles} aria-label="Toggle invisibles" />
        </Space>

        <Space size="small">
          <Typography.Text>Indent Guides</Typography.Text>
          <Switch checked={showIndentGuides} onChange={setShowIndentGuides} aria-label="Toggle indent guides" />
        </Space>
      </Space>

      <Typography.Text type="secondary">
        Raw dialplan XML for this outbound route.
        {/* TODO: wrap this route with <PermissionGuard permission="outboundRoute.xmlEdit"> once
            RBAC permissions are populated from the backend and an Axion-only-equivalent concept
            is confirmed — see outbound-routes.md §14/§25/§34. */}
      </Typography.Text>

      <OutboundRouteXmlEditor
        ref={editorRef}
        value={xml}
        onChange={setXml}
        fontSize={fontSize}
        showLineNumbers={showLineNumbers}
        showInvisibles={showInvisibles}
        showIndentGuides={showIndentGuides}
        readOnly={saving}
      />

      <Modal
        title="Go to Line"
        open={gotoLineOpen}
        onOk={handleGotoLineConfirm}
        onCancel={() => setGotoLineOpen(false)}
        okText="Go"
        destroyOnHidden
      >
        <InputNumber
          min={1}
          max={gotoLineTotal || undefined}
          value={gotoLineValue}
          onChange={setGotoLineValue}
          onPressEnter={handleGotoLineConfirm}
          placeholder={gotoLineTotal ? `1 - ${gotoLineTotal}` : 'Line number'}
          style={{ width: '100%' }}
          aria-label="Line number"
          autoFocus
        />
        {gotoLineError && (
          <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            {gotoLineError}
          </Typography.Text>
        )}
      </Modal>
    </Space>
  )
}

export default DialplanXmlPage
