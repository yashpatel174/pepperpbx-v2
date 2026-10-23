import React, { useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import { App as AntApp, ConfigProvider } from "antd";
import useThemeStore from "../store/theme";
import { getStructuralTokens } from "../config/theme";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/auth";

const App: React.FC = () => {
  const themeConfig = useThemeStore((state) => state.themeConfig);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDarkMode = themeConfig._algorithm.includes("dark");
  const structural = getStructuralTokens(isDarkMode);

  // Handle default route redirect
  useEffect(() => {
    if (location.pathname === "/") {
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/auth/login", { replace: true });
      }
    }
  }, [location.pathname, isAuthenticated, navigate]);

  // Don't show layout for auth pages
  const isAuthPage = location.pathname.startsWith("/auth/");

  return (
    <ConfigProvider
      theme={{
        algorithm: themeConfig.algorithm,
        token: {
          // Accent colors: user-configurable via presets/custom colors (store/theme.ts).
          colorPrimary: themeConfig.colors.primary,
          colorSuccess: themeConfig.colors.success,
          colorWarning: themeConfig.colors.warning,
          colorError: themeConfig.colors.error,
          colorInfo: themeConfig.colors.info,
          // Structural surfaces: fixed per light/dark mode, independent of accent colors
          // (see config/theme.ts StructuralTokens) so switching presets never breaks the
          // Axion-style header/sidebar/background/container hierarchy.
          colorBgLayout: structural.bodyBg,
          colorBgContainer: structural.containerBg,
          colorBorder: structural.borderColor,
          colorBorderSecondary: structural.borderColor,
        },
        components: {
          Layout: {
            headerBg: structural.headerBg,
            lightSiderBg: structural.siderBg,
            bodyBg: structural.bodyBg,
          },
          Menu: {
            itemBg: structural.siderBg,
            subMenuItemBg: structural.siderBg,
          },
          Table: {
            headerBg: structural.tableHeaderBg,
            borderColor: structural.tableBorderColor,
            rowHoverBg: structural.tableRowHoverBg,
          },
        },
      }}
    >
      <AntApp>{isAuthPage ? <AuthLayout /> : <MainLayout />}</AntApp>
    </ConfigProvider>
  );
};

export default App;
