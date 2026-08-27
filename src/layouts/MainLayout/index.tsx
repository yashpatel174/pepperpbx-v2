import React, { useState, useEffect } from 'react';

import { Layout, theme } from 'antd';
import PageSidebar from './Sidebar';
import PageContent from './Content';
import PageBreadcrumb from './Breadcrumb';
import Headerbar from './Header';
import useResponsive from '../../hooks/useResponsive';

const { Footer } = Layout;

const MainLayout: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { isMobile } = useResponsive()
  const [collapsed, setCollapsed] = useState(isMobile);
  const headerHeight = 64

  // Auto collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    }
  }, [isMobile])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Headerbar
        colorBgContainer={colorBgContainer}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <Layout style={{ marginTop: headerHeight }}>
        <PageSidebar
          height={`calc(100vh - ${headerHeight}px)`}
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
