import { useSearchParams } from 'react-router-dom'

export interface VoicemailContext {
  voicemailUuid: string
  voicemailId: string
}

/**
 * The mailbox a child page (Messages / Greetings) belongs to, read from `voicemail-uuid` and
 * `voicemail-id`. Both are required (voicemail.md §3) — `null` if either is missing, in which case
 * the page redirects to the list.
 */
const useVoicemailContext = (): VoicemailContext | null => {
  const [params] = useSearchParams()
  const voicemailUuid = params.get('voicemail-uuid')
  const voicemailId = params.get('voicemail-id')
  return voicemailUuid && voicemailId ? { voicemailUuid, voicemailId } : null
}

export default useVoicemailContext
