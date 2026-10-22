import { Input } from 'antd'

interface RegistrationFiltersProps {
  /** Uncommitted draft text — distinct from the committed search that actually queries the server. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon or clear — commits the search to the server immediately, skipping the debounce (registrations.md §6). */
  onSearch: (value: string) => void
}

/** Typing updates the draft at once; the hook debounces the server search. Enter/icon/clear commit immediately. */
const RegistrationFilters = ({ value, onChange, onSearch }: RegistrationFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search Registrations"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={(searchValue) => onSearch(searchValue)}
    style={{ width: '100%', maxWidth: 220 }}
    aria-label="Search registrations"
  />
)

export default RegistrationFilters
