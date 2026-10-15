import { noEdgeWhitespaceRule } from '../../components/common/validationRules'
import { PASSWORD_MIN_LENGTH } from './users.constants'

export { noEdgeWhitespaceRule }

export const usernameRules = [{ required: true, message: 'Username is required.' }, noEdgeWhitespaceRule]

export const emailRules = [
  { required: true, message: 'Email Address is required.' },
  { type: 'email' as const, message: 'Please enter a valid email address.' },
]

/** Names every unmet password requirement, or returns null when the password is acceptable. */
const describePasswordProblems = (password: string): string | null => {
  const missing: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) missing.push(`at least ${PASSWORD_MIN_LENGTH} characters`)
  if (!/\d/.test(password)) missing.push('a number')
  if (!/[a-z]/.test(password)) missing.push('a lowercase letter')
  if (!/[A-Z]/.test(password)) missing.push('an uppercase letter')
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('a special character')
  return missing.length > 0 ? `Password must contain ${missing.join(', ')}.` : null
}

/** Required on create. On edit it is optional (blank keeps the current password) but still checked when entered. */
export const passwordRules = (required: boolean) => [
  { required, message: 'Password is required.' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value) return
      const problem = describePasswordProblems(value)
      if (problem) throw new Error(problem)
    },
  },
]

/** Must match Password; re-validates when Password changes. Required only once a password is entered. */
export const confirmPasswordRules = (getPassword: () => string | undefined) => [
  {
    validator: async (_: unknown, value?: string) => {
      const password = getPassword()
      if (!password && !value) return
      if (!value) throw new Error('Please confirm the password.')
      if (value !== password) throw new Error('Passwords do not match.')
    },
  },
]

export const groupsRules = [{ required: true, message: 'Select a group.' }]

export const enabledRules = [{ required: true, message: 'Enabled is required.' }]

export const accountStatusRules = [{ required: true, message: 'Account Status is required.' }]

export const categoryRules = [{ required: true, message: 'Category is required.' }]
export const settingTypeRules = [{ required: true, message: 'Type is required.' }]
export const subcategoryRules = [{ required: true, message: 'Subcategory is required.' }]
