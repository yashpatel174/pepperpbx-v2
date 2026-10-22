import { Input } from 'antd'

interface GroupManagerFiltersProps {
  /** Uncommitted draft text — the hook owns it, distinct from the committed search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter, the search button, or clear. */
  onSearch: (value: string) => void
}

const GroupManagerFilters = ({ value, onChange, onSearch }: GroupManagerFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search groups"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 220 }}
    aria-label="Search groups"
  />
)

export default GroupManagerFilters
