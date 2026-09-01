import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface ExtensionFiltersProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Kept isolated from ExtensionTable so a future server-side search swap only touches
 * useExtensions() — this component's contract (value/onChange) doesn't need to change.
 */
const ExtensionFilters = ({ value, onChange }: ExtensionFiltersProps) => (
  <Input
    allowClear
    placeholder="Search extensions"
    prefix={<SearchOutlined />}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{ flex: '1 1 200px', minWidth: 160, maxWidth: 320 }}
    aria-label="Search extensions"
  />
)

export default ExtensionFilters
