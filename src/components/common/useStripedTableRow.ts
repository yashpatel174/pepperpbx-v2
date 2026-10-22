import { theme } from 'antd'

/**
 * Shared antd `<Table onRow={...}>` handler giving every other rendered row a very subtle,
 * token-driven background (`colorFillQuaternary` — Ant Design's most subtle fill step, the
 * semantic choice for zebra-stripe differentiation) instead of a flat single-color body.
 * Automatically correct in light, dark, and compact since it reads the active theme token —
 * never a hardcoded color. `index` is the row's position in the currently rendered page
 * (post-pagination, post-filter), so alternation is based purely on render order, not data.
 *
 * Hover and selected-row backgrounds are unaffected: those antd states paint their own
 * background directly on each cell, which sits on top of a plain row's background regardless
 * of striping.
 *
 * Usage: `<Table onRow={useStripedTableRow()} ... />` — reusable as-is by any future module's
 * table (Gateways, IVR, Ring Groups, …); nothing here is Extensions-specific.
 */
const useStripedTableRow = () => {
  const { token } = theme.useToken()

  return (_record: unknown, index?: number) => {
    if (index === undefined || index % 2 === 0) return {}
    return { style: { backgroundColor: token.colorFillQuaternary } }
  }
}

export default useStripedTableRow
