import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

export const groupNameRules = [
  { required: true, message: 'Group name is required' },
  noEdgeWhitespaceRule,
  { max: 64, message: 'Group name must be 64 characters or fewer' },
]

export const groupLevelRules = [{ required: true, message: 'Level is required' }]

export const groupDescriptionRules = [noEdgeWhitespaceRule, { max: 255, message: 'Description must be 255 characters or fewer' }]
