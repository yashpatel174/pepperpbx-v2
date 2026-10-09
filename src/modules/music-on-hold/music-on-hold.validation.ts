import { noEdgeWhitespaceRule } from '../../components/common/validationRules'
import { audioFileNameRule, maximumAudioFileSizeBytes, mohMimeTypes, numericFieldRule } from './music-on-hold.constants'

export { noEdgeWhitespaceRule }

export const categoryNameRules = [{ required: true, message: 'Category required' }, noEdgeWhitespaceRule]

export const timerNameRules = [{ required: true, message: 'Timer name required' }, noEdgeWhitespaceRule]

/** Optional numeric text field (music-on-hold.md §10) — an empty value passes. */
export const numericRules = [{ pattern: numericFieldRule, message: 'Only numbers are allowed, with a maximum length of 20 digits' }]

/** music-on-hold.md §10 upload rules, in the audit's order. Returns the first failing message. */
export const validateAudioFile = (file: File): string | null => {
  if (!mohMimeTypes.includes(file.type)) return 'Only MP3, WAV or OGG files are allowed'
  if (file.size > maximumAudioFileSizeBytes) return 'File should be less than 80MB'
  if (!audioFileNameRule.test(file.name.replace(/\.[^.]+$/, ''))) {
    return 'The File name can only contain letters, numbers, dashes (-), and underscores (_).'
  }
  return null
}
