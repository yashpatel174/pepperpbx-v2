import { Input } from 'antd'

interface ConferenceProfileFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The module's single free-text search (conference-profiles.md §6) — no other filters exist (§7).
 * Typing only edits the draft; Enter or the search icon commits it, with no debounce, as in Axion.
 */
const ConferenceProfileFilters = ({ value, onChange, onSearch }: ConferenceProfileFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search conference profiles"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 200 }}
    aria-label="Search conference profiles"
  />
)

export default ConferenceProfileFilters
