import React from 'react';

import { Outlet } from 'react-router-dom';
import { Card } from 'antd';
import useResponsive from '../../hooks/useResponsive';

const PageContent: React.FC = () => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div style={{
      padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
      minHeight: "calc(100vh - 200px)",
    }}>
      <Card style={{
        minHeight: "100%",
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <Outlet />
      </Card>
    </div>
  );
};

export default PageContent;
