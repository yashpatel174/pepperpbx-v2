import { useEffect, useRef, useState } from 'react'
import { Alert, App, Button, Modal, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { fetchRecordingAudio } from '../recordings.service'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { Recording, RecordingAudio } from '../recordings.types'

interface PlayRecordingModalProps {
  /** The recording being played, or null when closed. */
  recording: Recording | null
  /** Download needs the same access as Play (recordings.md §14/§25). */
  canDownload: boolean
  onClose: () => void
}

interface PlayerBodyProps {
  recording: Recording
  canDownload: boolean
}

/** Mounted only while open and keyed by recording, so a player never shows another recording's audio. */
const PlayerBody = ({ recording, canDownload }: PlayerBodyProps) => {
  const { message } = App.useApp()
  const [audio, setAudio] = useState<RecordingAudio | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const downloadingRef = useRef(false)

  useEffect(() => {
    let active = true
    fetchRecordingAudio(recording.recording_uuid)
      .then((resolved) => {
        if (active) setAudio(resolved)
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Failed to load the recording.'))
      })
    return () => {
      active = false
    }
  }, [recording.recording_uuid])

  const saveAs = (href: string, fileName: string) => {
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  /**
   * Remote URLs: fetch → blob → temporary anchor, as Axion does (recordings.md §3), so the download
   * works cross-origin where a bare `<a download>` is ignored. `blob:` / `data:` URLs are already
   * local, so they are saved directly — no fetch and no state change, hence no re-render of the
   * player row. Unlike Axion, the file is named after the recording's own file name instead of a
   * hardcoded `recordingFile.wav` (§26/§33).
   */
  const handleDownload = async () => {
    if (!audio || downloadingRef.current) return
    if (/^(blob|data):/.test(audio.url)) {
      saveAs(audio.url, audio.fileName)
      return
    }
    downloadingRef.current = true
    setDownloading(true)
    try {
      const response = await fetch(audio.url, { mode: 'cors' })
      if (!response.ok) throw new Error(`Download failed (${response.status}).`)
      const objectUrl = URL.createObjectURL(await response.blob())
      saveAs(objectUrl, audio.fileName)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to download the recording.'))
    } finally {
      downloadingRef.current = false
      setDownloading(false)
    }
  }

  if (error) return <Alert type="error" showIcon title={error} />
  if (!audio) return <Skeleton active paragraph={{ rows: 2 }} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', width: '100%' }}>
      {/* No `type` attribute: the audit's hardcoded audio/mp3 breaks WAV/OGG (recordings.md §28). */}
      {/* `nodownload` hides the native player's Download menu item (Chromium); the Download button below is the only download path. Playback speed is unaffected. */}
      <audio controls controlsList="nodownload" src={audio.url} style={{ flex: 1, minWidth: 200, colorScheme: 'light' }} aria-label="Audio player" />
      <Button type="primary" icon={<DownloadOutlined />} loading={downloading} disabled={!canDownload} onClick={handleDownload}>
        {/* Constant label: swapping to a longer "Downloading..." resized the button and re-wrapped the flex row. */}
        Download file
      </Button>
    </div>
  )
}

/** Play modal (recordings.md §3/§20): inline `<audio>` player plus a Download button. */
const PlayRecordingModal = ({ recording, canDownload, onClose }: PlayRecordingModalProps) => (
  <Modal
    open={!!recording}
    title={recording ? `Recording — ${recording.recording_name}` : 'Recording'}
    onCancel={onClose}
    destroyOnHidden
    width={600}
    footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>Close</Button>
      </div>
    }
  >
    {recording && <PlayerBody key={recording.recording_uuid} recording={recording} canDownload={canDownload} />}
  </Modal>
)

export default PlayRecordingModal
