import { Input } from 'antd'
import { searchMaxLength } from '../voicemail.constants'

interface VoicemailFiltersProps {
  /** Uncommitted draft text — the hook owns it, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click, and when the input is emptied (voicemail.md §4.2). */
  onSearch: (value: string) => void
}

/**
 * Search box (voicemail.md §4.2): typing updates the draft (the hook debounces the fetch); Enter or
 * the icon commits immediately; emptying the input commits an empty search immediately; a value of exactly `%` is ignored; max length 300.
 */
const VoicemailFilters = ({ value, onChange, onSearch }: VoicemailFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Enter Search..."
    maxLength={searchMaxLength}
    value={value}
    onChange={(e) => {
      const next = e.target.value
      if (next === '%') return
      onChange(next)
      if (next === '') onSearch('')
    }}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 220 }}
    aria-label="Search voicemails"
  />
)

export default VoicemailFilters
