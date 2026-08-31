import React, { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import { ConfigProvider } from 'antd';
import useThemeStore from '../store/theme';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth';

const App: React.FC = () => {
  const themeConfig = useThemeStore(state => state.themeConfig)
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  // Handle default route redirect
  useEffect(() => {
    if (location.pathname === '/') {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/auth/login', { replace: true })
      }
    }
  }, [location.pathname, isAuthenticated, navigate])

  // Don't show layout for auth pages
  const isAuthPage = location.pathname.startsWith('/auth/')

  return (
    <ConfigProvider theme={{
      algorithm: themeConfig.algorithm,
      token: {
        // Colors
        // Note: colorBgContainer and colorText are handled automatically by Ant Design's darkAlgorithm
        // They will be automatically adjusted based on the algorithm (light/dark mode)
        colorPrimary: themeConfig.colors.primary,
        colorSuccess: themeConfig.colors.success,
        colorWarning: themeConfig.colors.warning,
        colorError: themeConfig.colors.error,
        colorInfo: themeConfig.colors.info,
      }
    }}>
      {isAuthPage ? <AuthLayout /> : <MainLayout />}
    </ConfigProvider>
  )
};

export default App;
