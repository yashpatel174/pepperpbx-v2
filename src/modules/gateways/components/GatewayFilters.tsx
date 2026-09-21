import { Input } from "antd";

interface GatewayFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string;
  onChange: (value: string) => void;
  /** Fires on Enter or the search-icon click — matches the Axion reference's commit-on-Enter search, not live type-ahead. */
  onSearch: (value: string) => void;
}

/**
 * Gateway's search is commit-on-Enter/icon-click (per the Axion functional audit), unlike
 * Extensions' live type-ahead search — `Input.Search` is the right built-in Ant Design primitive
 * for this exact interaction, so no custom debounce logic is needed.
 */
const GatewayFilters = ({ value, onChange, onSearch }: GatewayFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search gateways"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{
      width: "100%",
      maxWidth: 200,
    }}
    aria-label="Search gateways"
  />
);

export default GatewayFilters;
