import { noEdgeWhitespaceRule } from '../../components/common/validationRules'
import { recordingNameRule } from './recordings.constants'

export { noEdgeWhitespaceRule }

/** recordings.md §10: required → no edge whitespace → letters/numbers/dashes/underscores. Shared by Edit and the Add modal. */
export const recordingNameRules = [
  { required: true, message: 'Recording name required' },
  noEdgeWhitespaceRule,
  { pattern: recordingNameRule, message: 'The Recording Name can only contain letters, numbers, dashes (-), and underscores (_).' },
]
