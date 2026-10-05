import { Input } from 'antd'

interface IVRMenuFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The single free-text search (ivr-menus.md §6). Typing commits after a short debounce
 * (useIVRMenus); Enter or the search icon commits immediately. Matching is server-side.
 */
const IVRMenuFilters = ({ value, onChange, onSearch }: IVRMenuFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search IVR menus"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 240 }}
    aria-label="Search IVR menus"
  />
)

export default IVRMenuFilters
