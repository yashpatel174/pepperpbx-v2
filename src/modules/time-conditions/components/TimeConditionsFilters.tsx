import { Input } from 'antd'

interface TimeConditionsFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The single free-text search (time-conditions.md §6). Typing commits after a short debounce
 * (useTimeConditions — a PepperPBX addition); Enter or the search icon commits immediately.
 */
const TimeConditionsFilters = ({ value, onChange, onSearch }: TimeConditionsFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search time conditions"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 200 }}
    aria-label="Search time conditions"
  />
)

export default TimeConditionsFilters
