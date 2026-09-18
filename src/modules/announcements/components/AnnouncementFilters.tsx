import { Input } from 'antd'

interface AnnouncementFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click — matches the audit's commit-on-Enter search (announcements.md §6). */
  onSearch: (value: string) => void
}

/**
 * `Input.Search` is the right primitive here: typing (`onChange`) stays immediately responsive,
 * Enter/the search icon (`onSearch`) commits instantly per the audit, and useAnnouncements.ts
 * debounces a plain typed value into an automatic commit ~400ms after typing stops — this
 * component itself has no debounce logic.
 */
const AnnouncementFilters = ({ value, onChange, onSearch }: AnnouncementFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search announcements"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ flex: '1 1 200px', minWidth: 160, maxWidth: 320 }}
    aria-label="Search announcements"
  />
)

export default AnnouncementFilters
