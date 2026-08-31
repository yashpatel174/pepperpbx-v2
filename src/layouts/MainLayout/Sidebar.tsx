import { useEffect, useState, useRef } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuItemType } from 'antd/es/menu/interface';
import { AdminRouterItem, routes } from '../../router';
import { useLocation, useNavigate } from 'react-router-dom';
import useResponsive from '../../hooks/useResponsive';

const { Sider } = Layout;

type OrderedMenuItem = MenuItemType & { order?: number; children?: MenuItemType[] }

/**
 * Converts a single route into its menu item, recursing into same-file `children` nesting.
 * Only whitelists the fields Ant Design's Menu actually renders (`key`/`label`/`icon`/`children`)
 * plus our own internal `order` (stripped again in getMenuItems before handing items to <Menu>) —
 * route-only metadata like `hideBreadcrumb`, `group`, `requiresAuth`, `hideInMenu` must never ride
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

const getMenuItems = (routes: AdminRouterItem[]): MenuItemType[] => {
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

/**
 * PageSidebar
 * @param props {autoCollapse?: boolean} automatic collapes menu when click another menu
 * @returns
 */
type PageSidebarProps = {
  autoCollapse?: boolean
  height?: string | number
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const PageSidebar = (props: PageSidebarProps) => {
  const { autoCollapse = true, height = '100%', collapsed: externalCollapsed, onCollapse } = props
  const menuItems = getMenuItems(routes)
  const navigate = useNavigate()
  const [lastOpenedMenu, setLastOpenedMenu] = useState<string[]>([])
  const location = useLocation()

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

  const onSwitchMenu = ({ key, keyPath }: { key: string; keyPath: string[] }) => {
    if (autoCollapse && keyPath.slice(1)) setLastOpenedMenu(keyPath.slice(1))
    navigate(key)
    // Auto collapse sidebar on mobile after navigation
    if (isMobile && !collapsed) {
      handleCollapse(true)
    }
  }

  const onOpenChange = (openKeys: string[]) => {
    setLastOpenedMenu(openKeys)
  }

  return (
    <Sider
      theme='light'
      style={{
        height,
        overflow: 'auto',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        zIndex: 100,
        ...(isMobile && collapsed ? { display: 'none' } : {}),
      }}
      collapsible
      collapsed={collapsed}
      onCollapse={handleCollapse}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 80}
      width={200}
      trigger={null}
    >
      <Menu
        openKeys={collapsed ? undefined : lastOpenedMenu}
        onOpenChange={collapsed ? undefined : onOpenChange}
        selectedKeys={[location.pathname]}
        mode="inline"
        items={menuItems}
        onClick={onSwitchMenu}
        inlineCollapsed={collapsed}
        triggerSubMenuAction={collapsed ? 'hover' : 'click'}
      />
    </Sider>
  )
}

export default PageSidebar
