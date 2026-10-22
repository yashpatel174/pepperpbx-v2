import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Button, Modal, Skeleton } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getApiErrorMessage } from "../../../services/api/apiError";

interface AudioPreviewModalProps {
  open: boolean;
  title: string;
  /** Resolves the audio URL (the play endpoints return it). Called each time the modal opens. */
  loadUrl: () => Promise<string>;
  /** File name offered by the Download button (voicemail.md §23: Voicemail-Message-File.mp3 / greetingFile.mp3). */
  downloadFileName: string;
  canDownload: boolean;
  /** Content under the player (e.g. the message transcription). */
  children?: ReactNode;
  /** Extra footer buttons rendered before Close (e.g. Toggle / Delete). */
  footerActions?: ReactNode;
  onClose: () => void;
}

interface AudioBodyProps {
  loadUrl: () => Promise<string>;
  downloadFileName: string;
  canDownload: boolean;
  children?: ReactNode;
}

/** Mounted only while the modal is open, so each open starts in the loading state and re-fetches. */
const AudioBody = ({ loadUrl, downloadFileName, canDownload, children }: AudioBodyProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadUrl()
      .then((resolved) => {
        if (active) setUrl(resolved);
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load the audio."));
        }
      });

    return () => {
      active = false;
    };
  }, [loadUrl]);

  if (error) return <Alert type="error" showIcon title={error} />;

  if (!url) return <Skeleton active paragraph={{ rows: 2 }} />;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
        }}
      >
        <audio
          controls
          src={url}
          style={{
            flex: 1,
            minWidth: 0,
            colorScheme: "light",
          }}
          aria-label="Audio player"
        />

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          href={url}
          download={downloadFileName}
          disabled={!canDownload}
        >
          Download file
        </Button>
      </div>

      {children}
    </>
  );
};

/** Audio player popup shared by the message View and greeting View (voicemail.md §23a/b). */
const AudioPreviewModal = ({
  open,
  title,
  loadUrl,
  downloadFileName,
  canDownload,
  children,
  footerActions,
  onClose,
}: AudioPreviewModalProps) => (
  <Modal
    open={open}
    title={title}
    onCancel={onClose}
    destroyOnHidden
    width={600}
    footer={
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {footerActions}
        <Button onClick={onClose}>Close</Button>
      </div>
    }
  >
    {open && (
      <AudioBody loadUrl={loadUrl} downloadFileName={downloadFileName} canDownload={canDownload}>
        {children}
      </AudioBody>
    )}
  </Modal>
);

export default AudioPreviewModal;
