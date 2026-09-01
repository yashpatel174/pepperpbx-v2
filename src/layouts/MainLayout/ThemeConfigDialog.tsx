import { useState, useEffect } from 'react'
import { Modal, Radio, ColorPicker, Space, Divider, Typography, Row, Col, Button, Alert } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { Color } from 'antd/es/color-picker'
import useThemeStore from '../../store/theme'
import { getAllPresetThemes } from '../../config/theme-presets'
import type { PresetThemeName } from '../../config/theme'
import type { ThemeConfig } from '../../config/theme'

const { Title, Text } = Typography

interface ThemeConfigDialogProps {
  open: boolean
  onClose: () => void
}

const ThemeConfigDialog = ({ open, onClose }: ThemeConfigDialogProps) => {
  const themeConfig = useThemeStore((state) => state.themeConfig)
  const currentPresetTheme = useThemeStore((state) => state.currentPresetTheme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const setCustomColor = useThemeStore((state) => state.setCustomColor)
  const resetTheme = useThemeStore((state) => state.resetTheme)

  // Check if dark mode is active
  const isDarkMode = themeConfig._algorithm.includes('dark')

  const [selectedPreset, setSelectedPreset] = useState<PresetThemeName | 'custom'>(
    currentPresetTheme || 'custom'
  )
  const [customColors, setCustomColors] = useState<ThemeConfig['colors']>(themeConfig.colors)

  const presetThemes = getAllPresetThemes()

  useEffect(() => {
    if (open) {
      setSelectedPreset(currentPresetTheme || 'custom')
      setCustomColors(themeConfig.colors)
    }
  }, [open, currentPresetTheme, themeConfig])

  const handlePresetChange = (presetName: PresetThemeName) => {
    setSelectedPreset(presetName)
    setTheme(presetName)
  }

  const handleCustomColorChange = (colorKey: keyof ThemeConfig['colors'], color: Color) => {
    const hexColor = color.toHexString()
    setCustomColors((prev) => ({
      ...prev,
      [colorKey]: hexColor,
    }))
    setCustomColor(colorKey, hexColor)
    setSelectedPreset('custom')
  }

  const colorLabels: Record<keyof ThemeConfig['colors'], string> = {
    primary: 'Primary',
    secondary: 'Secondary',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    info: 'Info',
    background: 'Background',
    text: 'Text',
  }

  const handleReset = () => {
    resetTheme()
  }

  return (
    <Modal
      title="Theme Configuration"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          Reset to Default
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={700}
      destroyOnHidden
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5}>Preset Themes</Title>
          <Radio.Group
            value={selectedPreset}
            onChange={(e) => {
              const value = e.target.value
              if (value === 'custom') {
                setSelectedPreset('custom')
              } else {
                handlePresetChange(value as PresetThemeName)
              }
            }}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              {presetThemes.map((preset) => (
                <Col span={8} key={preset.name}>
                  <Radio value={preset.name} style={{ width: '100%' }}>
                    <Space>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          backgroundColor: preset.colors.primary,
                          border: '1px solid #d9d9d9',
                        }}
                      />
                      <span>{preset.label}</span>
                    </Space>
                  </Radio>
                </Col>
              ))}
              <Col span={8}>
                <Radio value="custom">Custom</Radio>
              </Col>
            </Row>
          </Radio.Group>
        </div>

        <Divider />

        <div>
          <Title level={5}>Custom Colors</Title>
          {isDarkMode && (
            <Alert
              message="Dark Mode Active"
              description="Background and Text colors are automatically handled by Ant Design's dark algorithm. Custom values for these colors mainly apply to light mode."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {Object.entries(colorLabels).map(([key, label]) => {
              const isAutoHandled = isDarkMode && (key === 'background' || key === 'text')
              return (
                <Row key={key} align="middle" gutter={16}>
                  <Col span={6}>
                    <Text strong>
                      {label}
                      {isAutoHandled && (
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 'normal' }}>
                          (auto in dark)
                        </Text>
                      )}
                    </Text>
                  </Col>
                  <Col span={18}>
                    <ColorPicker
                      value={customColors[key as keyof ThemeConfig['colors']]}
                      onChange={(color) =>
                        handleCustomColorChange(key as keyof ThemeConfig['colors'], color)
                      }
                      showText
                      format="hex"
                      disabled={isAutoHandled}
                    />
                  </Col>
                </Row>
              )
            })}
          </Space>
        </div>
      </Space>
    </Modal>
  )
}

export default ThemeConfigDialog
