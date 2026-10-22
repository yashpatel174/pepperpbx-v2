import { MappingAlgorithm, theme } from 'antd'

/**
 * Theme color configuration
 */
export interface ThemeColors {
  /** Primary color */
  primary: string
  /** Secondary color */
  secondary: string
  /** Success color */
  success: string
  /** Warning color */
  warning: string
  /** Error color */
  error: string
  /** Info color */
  info: string
  /** Background color (mainly for light mode, dark mode uses Ant Design's darkAlgorithm) */
  background: string
  /** Text color (mainly for light mode, dark mode uses Ant Design's darkAlgorithm) */
  text: string
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Color configuration */
  colors: ThemeColors
  /** Ant Design algorithm array */
  algorithm: MappingAlgorithm[]
  /** Algorithm string array (for persistence) */
  _algorithm: string[]
}

/**
 * Preset theme name
 */
export type PresetThemeName = 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'red' | 'cyan'

/**
 * Preset theme configuration
 */
export interface PresetTheme {
  name: PresetThemeName
  label: string
  colors: ThemeColors
}

/**
 * Algorithm mapping
 */
export const algorithmMap: Record<string, MappingAlgorithm> = {
  default: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
  compact: theme.compactAlgorithm,
}

/**
 * Validate color format (hex format)
 */
export function isValidColor(color: string): boolean {
  if (!color) return false
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexPattern.test(color)
}

/**
 * Convert color to rgba format
 */
export function toRgba(color: string, alpha: number): string {
  if (!color) return `rgba(0, 0, 0, ${alpha})`
  
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  }
  
  let hex = color.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('')
  }
  
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Create default theme configuration
 */
export function createDefaultThemeConfig(): ThemeConfig {
  return {
    colors: {
      primary: '#1890ff',
      secondary: '#722ed1',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff',
      background: '#ffffff',
      text: '#000000',
    },
    algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm],
    _algorithm: ['default', 'compact'],
  }
}

/**
 * Build algorithm array from algorithm string array
 */
export function buildAlgorithmArray(algorithmStrings: string[]): MappingAlgorithm[] {
  return algorithmStrings.map((item) => algorithmMap[item] || theme.defaultAlgorithm)
}

/**
 * Structural surface tokens (header/sidebar/background/container/table/border).
 *
 * These are fixed per light/dark mode and are deliberately independent of the
 * user-configurable accent colors (`ThemeColors.primary` etc.) — switching color
 * presets must not change the app's structural surface hierarchy. Values are derived
 * from the Axion reference screenshots (light: white surfaces over a subtle blue-gray
 * page background; dark: a dark navy hierarchy, never pure black).
 */
export interface StructuralTokens {
  headerBg: string
  siderBg: string
  bodyBg: string
  containerBg: string
  borderColor: string
  tableHeaderBg: string
  tableRowHoverBg: string
  tableBorderColor: string
}

export const lightStructuralTokens: StructuralTokens = {
  headerBg: '#ffffff',
  siderBg: '#ffffff',
  bodyBg: '#f0f3f8',
  containerBg: '#ffffff',
  borderColor: '#e6ebf1',
  tableHeaderBg: '#f5f7fa',
  tableRowHoverBg: '#f0f5ff',
  tableBorderColor: '#e8edf3',
}

export const darkStructuralTokens: StructuralTokens = {
  headerBg: '#0f1729',
  siderBg: '#0f1729',
  bodyBg: '#131d33',
  containerBg: '#18233d',
  borderColor: '#28375a',
  tableHeaderBg: '#22314f',
  tableRowHoverBg: '#1e2c4a',
  tableBorderColor: '#2c3c5e',
}

/**
 * Resolve the structural token set for the currently active algorithm.
 */
export function getStructuralTokens(isDarkMode: boolean): StructuralTokens {
  return isDarkMode ? darkStructuralTokens : lightStructuralTokens
}

