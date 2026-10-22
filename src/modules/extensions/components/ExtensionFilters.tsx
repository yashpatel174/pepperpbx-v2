import { Input } from 'antd'

interface ExtensionFiltersProps {
  /** Uncommitted draft text — distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click — commits immediately, skipping the debounce. */
  onSearch: (value: string) => void
}

/**
 * Kept isolated from ExtensionTable so a future server-side search swap only touches
 * useExtensions() — this component's contract (value/onChange/onSearch) doesn't need to change.
 */
const ExtensionFilters = ({ value, onChange, onSearch }: ExtensionFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search extensions"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{
      width: "100%",
      maxWidth: 200,
    }}
    aria-label="Search extensions"
  />
)

export default ExtensionFilters
