import { useMemo } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { App, Card, Space, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import QueueAgentTable from '../components/QueueAgentTable'
import QueueMemberTable from '../components/QueueMemberTable'
import { ACTIVE_CALL_CENTER_PATH, callCenterEditPath } from '../active-call-center.constants'
import { agentBridge, agentTransfer, eavesdrop } from '../active-call-center.service'
import { parseQueueSelection } from '../active-call-center.utils'
import useQueueActivity from '../useQueueActivity'
import useActiveCallCenterPermissions from '../useActiveCallCenterPermissions'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { AgentRow, MemberRow, MockActionResult } from '../active-call-center.types'

/**
 * Activity of one queue (active-call-center.md §3/§4): live-style agent and member tables with
 * Waiting / Trying / Answered counts. Here it is a one-time snapshot of mock data — nothing
 * updates by itself and the durations do not tick; Refresh re-requests the snapshot. The queue
 * comes from the URL (Axion's `window` globals are not reproduced); a URL without one goes back to the list (§3).
 */
const QueueActivityPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const { canView } = useActiveCallCenterPermissions()

  const selection = useMemo(() => parseQueueSelection(searchParams), [searchParams])
  const { agents, members, counts, queueName, queueUuid, loaded, loading, error, refresh } = useQueueActivity(selection, canView)

  if (!selection) return <Navigate to={ACTIVE_CALL_CENTER_PATH} replace />

  // Fire-and-forget like Axion (§11): no confirmation and no page-level spinner. The result is
  // reported as mock output — it never claims the PBX performed anything.
  const runAction = async (action: () => Promise<MockActionResult>, failure: string) => {
    try {
      const result = await action()
      message.info(result.message)
    } catch (err) {
      message.error(getApiErrorMessage(err, failure))
    }
  }

  const handleAgentCall = (agent: AgentRow) =>
    runAction(() => agentBridge({ extension: agent.extension, domain_name: agent.domain_name || selection.domainName }), 'Failed to call the agent.')

  const handleAgentTransfer = (agent: AgentRow) =>
    runAction(() => agentTransfer({ agent_uuid: agent.call_center_agent_uuid }), 'Failed to transfer the call.')

  // BACKEND CONTRACT REQUIRED: the audit doesn't print the agent Eavesdrop parameters; the agent's
  // extension and uuid are used as `caller_id_number` / `uuid`.
  const handleAgentEavesdrop = (agent: AgentRow) =>
    runAction(() => eavesdrop({ caller_id_number: agent.extension, uuid: agent.call_center_agent_uuid }), 'Failed to eavesdrop.')

  const handleMemberEavesdrop = (member: MemberRow) =>
    runAction(() => eavesdrop({ caller_id_number: member.number, uuid: member.session_uuid }), 'Failed to eavesdrop.')

  // Edit belongs to the Call Center module (§26).
  const handleEditQueue = () => {
    if (!queueUuid) {
      message.warning('This queue has no id to edit.')
      return
    }
    navigate(callCenterEditPath(queueUuid))
  }

  const renderBody = () => {
    if (!canView) return <PermissionDenied />
    // Blocking error only when there is no snapshot yet; a failed refresh keeps the last one visible.
    if (error && !loaded) return <ErrorState message={error} onRetry={refresh} />
    if (!loaded) return <LoadingState rows={8} />
    return (
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {error && <ErrorState type="warning" message={error} description="Showing the last loaded activity." onRetry={refresh} />}
        <Card title="Agents">
          <QueueAgentTable
            data={agents}
            loading={loading}
            onEavesdrop={handleAgentEavesdrop}
            onTransfer={handleAgentTransfer}
            onCall={handleAgentCall}
            onEdit={handleEditQueue}
          />
        </Card>
        <Card title="Queue">
          <QueueMemberTable data={members} loading={loading} onEavesdrop={handleMemberEavesdrop} onEdit={handleEditQueue} />
        </Card>
      </Space>
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Queue Activity"
        actions={[
          { key: 'back', label: 'Back to Queue List', icon: <ArrowLeftOutlined />, onClick: () => navigate(ACTIVE_CALL_CENTER_PATH) },
          ...(canView ? [{ key: 'refresh', label: 'Refresh', icon: <ReloadOutlined />, onClick: () => void refresh(), loading }] : []),
        ]}
        filters={
          canView && (
            <>
              <Typography.Text strong>{queueName || `${selection.queueExtension}@${selection.domainName}`}</Typography.Text>
              <Space size="small" wrap>
                <Tag color="warning">Waiting: {counts.waiting}</Tag>
                <Tag color="processing">Trying: {counts.trying}</Tag>
                <Tag color="success">Answered: {counts.answered}</Tag>
              </Space>
            </>
          )
        }
      />

      {renderBody()}
    </Space>
  )
}

export default QueueActivityPage
