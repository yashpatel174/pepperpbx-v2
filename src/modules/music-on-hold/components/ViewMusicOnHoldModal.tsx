import { useEffect, useRef, useState } from 'react'
import { Alert, App, Button, Modal, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { fetchMohAudio } from '../music-on-hold.service'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { MohAudio } from '../music-on-hold.types'

export interface ViewMohTarget {
  categoryUuid: string
  fileName: string
}

interface ViewMusicOnHoldModalProps {
  /** The file being previewed, or null when closed. */
  target: ViewMohTarget | null
  /** Download needs the same access as View. */
  canDownload: boolean
  onClose: () => void
}

interface PlayerBodyProps {
  target: ViewMohTarget
  canDownload: boolean
}

/** Mounted only while open and keyed by file, so a player never shows another file's audio. */
const PlayerBody = ({ target, canDownload }: PlayerBodyProps) => {
  const { message } = App.useApp()
  const [audio, setAudio] = useState<MohAudio | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const downloadingRef = useRef(false)

  useEffect(() => {
    let active = true
    fetchMohAudio(target.categoryUuid, target.fileName)
      .then((resolved) => {
        if (active) setAudio(resolved)
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Failed to load the audio file.'))
      })
    return () => {
      active = false
    }
  }, [target.categoryUuid, target.fileName])

  const saveAs = (href: string, fileName: string) => {
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  /**
   * Remote URLs: fetch → blob → temporary anchor, as Axion does (music-on-hold.md §3), so the
   * download works cross-origin where a bare `<a download>` is ignored. `blob:` / `data:` URLs are
   * already local, so they are saved directly — no fetch and no state change, hence no re-render of
   * the player row. Unlike Axion, the file is named after the audio file itself instead of a
   * hardcoded `recordingFile.wav` (§26/§33). The temporary object URL is revoked after the download starts.
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
      message.error(getApiErrorMessage(err, 'Failed to download the audio file.'))
    } finally {
      downloadingRef.current = false
      setDownloading(false)
    }
  }

  if (error) return <Alert type="error" showIcon title={error} />
  if (!audio) return <Skeleton active paragraph={{ rows: 2 }} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', width: '100%' }}>
      {/* No `type` attribute: a hardcoded audio/mp3 would break WAV/OGG. `nodownload` hides the native Download menu item; the button is the only download path. */}
      <audio controls controlsList="nodownload" src={audio.url} style={{ flex: 1, minWidth: 200, colorScheme: 'light' }} aria-label="Audio player" />
      <Button type="primary" icon={<DownloadOutlined />} loading={downloading} disabled={!canDownload} onClick={handleDownload}>
        {/* Constant label: swapping to a longer "Downloading..." resized the button and re-wrapped the flex row. */}
        Download file
      </Button>
    </div>
  )
}

/** View popup (music-on-hold.md §3/§20): inline `<audio>` player plus a Download button. */
const ViewMusicOnHoldModal = ({ target, canDownload, onClose }: ViewMusicOnHoldModalProps) => (
  <Modal
    open={!!target}
    title={target ? `Music On Hold — ${target.fileName}` : 'Music On Hold'}
    onCancel={onClose}
    destroyOnHidden
    width={600}
    footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>Close</Button>
      </div>
    }
  >
    {target && <PlayerBody key={`${target.categoryUuid}/${target.fileName}`} target={target} canDownload={canDownload} />}
  </Modal>
)

export default ViewMusicOnHoldModal
