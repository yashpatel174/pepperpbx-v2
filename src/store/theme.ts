import { uniq } from 'lodash-es'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeConfig, PresetThemeName } from '../config/theme'
import { createDefaultThemeConfig, buildAlgorithmArray } from '../config/theme'
import { getPresetTheme } from '../config/theme-presets'

type ConfigState = {
  themeConfig: ThemeConfig
  /** Current preset theme name */
  currentPresetTheme?: PresetThemeName
  themeOptions: { label: string, value: string }[]
}

type Actions = {
  setAlgorithm: (v: string) => void
  setCompactAlgorithm: (v: string) => void
  /** Switch preset theme */
  setTheme: (presetName: PresetThemeName) => void
  /** Customize a single color */
  setCustomColor: (colorKey: keyof ThemeConfig['colors'], color: string) => void
  /** Reset theme to default configuration */
  resetTheme: () => void
  /** Get primary color (backward compatibility) */
  getPrimaryColor: () => string
}

// Create default theme config (use orange as default, maintain backward compatibility)
const defaultThemeConfig = createDefaultThemeConfig()
// Use orange theme colors as default
const orangePreset = getPresetTheme('orange')
if (orangePreset) {
  defaultThemeConfig.colors = { ...orangePreset.colors }
}

const useThemeStore = create<ConfigState & Actions>()(
  persist(
    (set, get) => ({
      themeConfig: defaultThemeConfig,
      currentPresetTheme: 'orange',
      themeOptions: [
        { label: 'Light', value: 'default' },
        { label: 'Dark', value: 'dark' },
        { label: 'Compact', value: 'compact' },
      ],
      setAlgorithm: (v: string) => {
        set((state) => {
          const includesCompact = state.themeConfig._algorithm.includes('compact')
          const _algorithm = includesCompact ? [v, 'compact'] : [v]

          return {
            themeConfig: {
              ...state.themeConfig,
              _algorithm,
              algorithm: buildAlgorithmArray(_algorithm),
            }
          }
        })
      },
      setCompactAlgorithm: (v: string) => {
        set((state) => {
          const withoutCompact = state.themeConfig._algorithm.filter((item) => item !== 'compact')
          const _algorithm = uniq(v ? [...withoutCompact, 'compact'] : withoutCompact)

          return {
            themeConfig: {
              ...state.themeConfig,
              _algorithm,
              algorithm: buildAlgorithmArray(_algorithm),
            }
          }
        })
      },
      setTheme: (presetName: PresetThemeName) => {
        const preset = getPresetTheme(presetName)
        if (preset) {
          set((state) => ({
            currentPresetTheme: presetName,
            themeConfig: {
              ...state.themeConfig,
              colors: { ...preset.colors },
            }
          }))
        }
      },
      setCustomColor: (colorKey: keyof ThemeConfig['colors'], color: string) => {
        set((state) => ({
          currentPresetTheme: undefined, // Clear preset theme after customizing colors
          themeConfig: {
            ...state.themeConfig,
            colors: {
              ...state.themeConfig.colors,
              [colorKey]: color,
            }
          }
        }))
      },
      resetTheme: () => {
        // Reset to orange theme and default configurations
        const preset = getPresetTheme('orange')
        if (preset) {
          set((state) => ({
            currentPresetTheme: 'orange',
            themeConfig: {
              ...state.themeConfig,
              colors: { ...preset.colors },
            }
          }))
        }
      },
      getPrimaryColor: () => {
        return get().themeConfig.colors.primary
      },
    }),
    {
      name: 'config-storage',
      onRehydrateStorage: () => (state) => {
        // Rebuild algorithm array from _algorithm strings after rehydration
        if (state) {
          // Handle old version data migration
          const oldConfig = state.themeConfig as ThemeConfig & { primaryColor?: string }

          // Migrate from old color structure
          if ('primaryColor' in oldConfig && oldConfig.primaryColor && !oldConfig.colors) {
            state.themeConfig = {
              colors: {
                primary: oldConfig.primaryColor || '#03dac6',
                secondary: '#018786',
                success: '#52c41a',
                warning: '#faad14',
                error: '#ff4d4f',
                info: '#1890ff',
                background: '#ffffff',
                text: '#000000',
              },
              _algorithm: oldConfig._algorithm || ['default'],
              algorithm: buildAlgorithmArray(oldConfig._algorithm || ['default']),
            }
          } else {
            state.themeConfig.algorithm = buildAlgorithmArray(state.themeConfig._algorithm)
          }
        }
      },
    }
  )
)

export default useThemeStore
