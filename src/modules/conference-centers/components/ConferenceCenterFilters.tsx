import { Input } from 'antd'

interface ConferenceCenterFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/** The module's single free-text search (conference-centers.md §6) — no other filters exist in the audit. */
const ConferenceCenterFilters = ({ value, onChange, onSearch }: ConferenceCenterFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search conference centers"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 200 }}
    aria-label="Search conference centers"
  />
)

export default ConferenceCenterFilters
