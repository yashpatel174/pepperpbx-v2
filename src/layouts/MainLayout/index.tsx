import React, { useState, useEffect } from 'react';

import { Layout, theme } from 'antd';
import PageSidebar from './Sidebar';
import PageContent from './Content';
import PageBreadcrumb from './Breadcrumb';
import Headerbar from './Header';
import useResponsive from '../../hooks/useResponsive';

const { Footer } = Layout;

const MainLayout: React.FC = () => {
  const { isMobile } = useResponsive()
  const [collapsed, setCollapsed] = useState(isMobile);
  const { token } = theme.useToken()
  // Matches antd's own Layout.headerHeight formula (controlHeight * 2, see
  // node_modules/antd/es/layout/style/index.js) so the fixed Sidebar/content offset
  // always lines up with the Header's real rendered height under any algorithm
  // (compact is permanently on for this app — see store/theme.ts — which shrinks
  // controlHeight and, with it, the header, well below a hardcoded 64px).
  const headerHeight = token.controlHeight * 2

  // Auto collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    }
  }, [isMobile])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Headerbar
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <Layout style={{ marginTop: headerHeight }}>
        <PageSidebar
          height={`calc(100vh - ${headerHeight}px)`}
          topOffset={headerHeight}
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
        <Layout style={{
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 200),
          transition: 'margin-left 0.2s',
          minHeight: `calc(100vh - ${headerHeight}px)`,
        }}>
          <PageBreadcrumb />
          <PageContent></PageContent>
          <Footer style={{ textAlign: 'center', padding: '16px' }}>
            PepperPBX ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
