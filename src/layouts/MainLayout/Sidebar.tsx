import { useEffect, useState, useRef } from 'react';
import { Collapse, Layout, Menu, theme } from 'antd';
import type { MenuItemType } from 'antd/es/menu/interface';
import { AdminRouterItem, routes } from '../../router';
import { useLocation, useNavigate } from 'react-router-dom';
import useResponsive from '../../hooks/useResponsive';

const { Sider } = Layout;

/**
 * Expanded sidebar width. Sized so the longest second-level labels ("Conference Profiles",
 * "Conference Controls" at the menu's bold fontSizeLG) fit untruncated even with a classic
 * scrollbar showing. MainLayout offsets the content by the same value.
 */
export const SIDEBAR_WIDTH = 256

type OrderedMenuItem = MenuItemType & { order?: number; children?: MenuItemType[] }

/**
 * Converts a single route into its menu item, recursing into same-file `children` nesting.
 * Only whitelists the fields Ant Design's Menu actually renders (`key`/`label`/`icon`/`children`)
 * plus our own internal `order` (stripped again in getMenuItems before handing items to <Menu>) —
 * route-only metadata like `hideBreadcrumb`, `group`, `hideInMenu` must never ride
 * along on the object passed to <Menu items>, since rc-menu forwards unrecognized item properties
 * straight onto the rendered <li> DOM node.
 */
const buildMenuItem = (itm: AdminRouterItem): OrderedMenuItem | null => {
  if (!itm.meta) return null
  if (itm.meta.hideInMenu) return null
  const { key, label, icon, order } = itm.meta
  const children = itm.children ? getMenuItems(itm.children) : undefined
  return { key, label, icon, order, children }
}

/** Strips the internal-only `order` sort key before an item reaches <Menu items> — Ant
 * Design's Menu doesn't consume it, and only Menu-relevant fields belong on that object. */
const withoutOrder = (item: OrderedMenuItem): OrderedMenuItem => ({
  key: item.key,
  label: item.label,
  icon: item.icon,
  children: item.children,
})

const getMenuItems = (routes: AdminRouterItem[]): OrderedMenuItem[] => {
  // Routes that declare `meta.group` are bucketed under one shared parent menu entry —
  // this lets separate module files (e.g. Extensions, later Gateways) land under the same
  // "Account" parent without any of them nesting in the actual route tree. See router/index.tsx.
  const groupBuckets = new Map<string, { group: NonNullable<NonNullable<AdminRouterItem['meta']>['group']>; items: AdminRouterItem[] }>()
  const standalone: AdminRouterItem[] = []

  routes.forEach(itm => {
    const group = itm.meta?.group
    if (group) {
      const bucket = groupBuckets.get(group.key)
      if (bucket) {
        bucket.items.push(itm)
      } else {
        groupBuckets.set(group.key, { group, items: [itm] })
      }
    } else {
      standalone.push(itm)
    }
  })

  const groupMenuItems: OrderedMenuItem[] = Array.from(groupBuckets.values()).map(({ group, items }) => ({
    key: group.key,
    label: group.label,
    icon: group.icon,
    order: group.order,
    // Items inside a group are rendered as plain leaves — their own `meta.group` (used only
    // to place them here) is not re-applied recursively.
    children: [...items]
      .sort((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0))
      .map(buildMenuItem)
      .filter((mi): mi is OrderedMenuItem => !!mi)
      .map(withoutOrder),
  }))

  const standaloneMenuItems: OrderedMenuItem[] = [...standalone]
    .sort((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0))
    .map(buildMenuItem)
    .filter((mi): mi is OrderedMenuItem => !!mi)

  return [...groupMenuItems, ...standaloneMenuItems]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(withoutOrder)
}

/** Consecutive standalone items render as one Menu; each `meta.group` renders as its own panel. */
type SidebarSegment = { group: OrderedMenuItem } | { items: OrderedMenuItem[] }

const toSegments = (items: OrderedMenuItem[]) =>
  items.reduce<SidebarSegment[]>((segments, item) => {
    if (item.children?.length) {
      segments.push({ group: item })
      return segments
    }
    const last = segments[segments.length - 1]
    if (last && 'items' in last) last.items.push(item)
    else segments.push({ items: [item] })
    return segments
  }, [])

/** Inline Menu items sit at itemMarginInline (4) + inlineIndent (24); group headers align to it. */
const MENU_ITEM_INSET = 28

/**
 * PageSidebar — expanded, groups are an accordion of Ant Design `Collapse` panels (one open at a
 * time) and standalone items stay plain Menu items, all built from the route metadata via
 * getMenuItems. Collapsed (desktop icon rail) keeps the single inline Menu with hover pop-outs,
 * which panels can't provide.
 */
type PageSidebarProps = {
  height?: string | number
  /** Fixed-position top offset, in px — must match the Header's actual rendered height. */
  topOffset?: number
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const PageSidebar = (props: PageSidebarProps) => {
  const { height = '100%', topOffset = 64, collapsed: externalCollapsed, onCollapse } = props
  const { token } = theme.useToken()
  const menuItems = getMenuItems(routes)
  const navigate = useNavigate()
  const location = useLocation()
  // Accordion state shared by every group panel: at most one open. Starts on the group that holds
  // the current route, so a deep link lands with its section expanded.
  const [openGroup, setOpenGroup] = useState<string | undefined>(() => {
    const activeGroup = menuItems.find((item) => item.children?.some((child) => child.key === location.pathname))
    return activeGroup ? String(activeGroup.key) : undefined
  })

  // Responsive breakpoints
  const { isMobile } = useResponsive()

  // Auto collapse on mobile
  const [internalCollapsed, setInternalCollapsed] = useState(isMobile)
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  const prevIsMobileRef = useRef<boolean | null>(null)

  // Only auto collapse when switching from desktop to mobile, not when user manually opens sidebar
  useEffect(() => {
    const prevIsMobile = prevIsMobileRef.current
    // Only check transition if we have a previous value (skip first render)
    if (prevIsMobile !== null && !prevIsMobile && isMobile && !collapsed) {
      // Switching from desktop to mobile, auto collapse
      onCollapse?.(true)
      setInternalCollapsed(true)
    }
    // Update ref after checking, so next render has the previous value
    prevIsMobileRef.current = isMobile
  }, [isMobile, collapsed, onCollapse])

  const handleCollapse = (collapsed: boolean) => {
    if (onCollapse) {
      onCollapse(collapsed)
    } else {
      setInternalCollapsed(collapsed)
    }
  }

  const onSwitchMenu = ({ key }: { key: string }) => {
    navigate(key)
    // Auto collapse sidebar on mobile after navigation
    if (isMobile && !collapsed) {
      handleCollapse(true)
    }
  }

  const menuStyle = { fontSize: token.fontSizeLG, fontWeight: token.fontWeightStrong }
  const selectedKeys = [location.pathname]

  // Several Menus share the column, so their own right borders are dropped to avoid a broken line.
  const renderExpanded = () =>
    toSegments(menuItems).map((segment) =>
      'items' in segment ? (
        <Menu
          key={`items-${String(segment.items[0].key)}`}
          mode="inline"
          items={segment.items}
          selectedKeys={selectedKeys}
          onClick={onSwitchMenu}
          style={{ ...menuStyle, borderInlineEnd: 'none' }}
        />
      ) : (
        <Collapse
          key={`group-${String(segment.group.key)}`}
          ghost
          expandIconPlacement="end"
          activeKey={openGroup === String(segment.group.key) ? [openGroup] : []}
          onChange={(keys) => setOpenGroup(keys.length > 0 ? String(segment.group.key) : undefined)}
          styles={{
            header: { paddingInlineStart: MENU_ITEM_INSET, paddingInlineEnd: token.paddingMD, alignItems: 'center' },
            body: { padding: 0 },
          }}
          items={[
            {
              key: String(segment.group.key),
              label: (
                <span style={{ ...menuStyle, display: 'flex', alignItems: 'center', gap: token.marginSM }}>
                  {segment.group.icon}
                  {segment.group.label}
                </span>
              ),
              children: (
                <Menu
                  mode="inline"
                  // Children keep the indentation they had as second-level submenu items.
                  inlineIndent={48}
                  items={segment.group.children}
                  selectedKeys={selectedKeys}
                  onClick={onSwitchMenu}
                  style={{ ...menuStyle, borderInlineEnd: 'none' }}
                />
              ),
            },
          ]}
        />
      ),
    )

  return (
    <Sider
      theme='light'
      style={{
        height,
        // Own vertical scroll: thin, token-coloured thumb on a transparent track (light + dark),
        // and scroll chaining stopped so reaching the end never scrolls the page behind.
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'thin',
        scrollbarColor: `${token.colorTextQuaternary} transparent`,
        position: 'fixed',
        left: 0,
        top: topOffset,
        bottom: 0,
        zIndex: 100,
        ...(isMobile && collapsed ? { display: 'none' } : {}),
      }}
      collapsible
      collapsed={collapsed}
      onCollapse={handleCollapse}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 80}
      width={SIDEBAR_WIDTH}
      trigger={null}
    >
      {collapsed ? (
        <Menu
          selectedKeys={selectedKeys}
          mode="inline"
          items={menuItems}
          onClick={onSwitchMenu}
          inlineCollapsed
          triggerSubMenuAction="hover"
          style={menuStyle}
        />
      ) : (
        renderExpanded()
      )}
    </Sider>
  )
}

export default PageSidebar
