import React from 'react';

import { Outlet } from 'react-router-dom';
import { Card } from 'antd';
import useResponsive from '../../hooks/useResponsive';

const PageContent: React.FC = () => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div style={{
      padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
    }}>
      <Card style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '5px',
      }}>
        <Outlet />
      </Card>
    </div>
  );
};

export default PageContent;
