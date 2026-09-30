import { Input } from 'antd'

interface CallFlowsFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The single free-text search (call-flows.md §6). Typing commits after a short debounce
 * (useCallFlows); Enter or the search icon commits immediately.
 */
const CallFlowsFilters = ({ value, onChange, onSearch }: CallFlowsFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search call flows"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 240 }}
    aria-label="Search call flows"
  />
)

export default CallFlowsFilters
