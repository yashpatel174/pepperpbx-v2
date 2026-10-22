import { Input } from 'antd'

interface ConferenceControlFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The module's single free-text search (conference-controls.md §6) — no other filters exist. Typing
 * commits after a short debounce (useConferenceControls); Enter/the search icon commit immediately.
 */
const ConferenceControlFilters = ({ value, onChange, onSearch }: ConferenceControlFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search conference controls"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 200 }}
    aria-label="Search conference controls"
  />
)

export default ConferenceControlFilters
