import { forwardRef, useImperativeHandle, useRef } from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-xml'
import 'ace-builds/src-noconflict/theme-github_dark'
import 'ace-builds/src-noconflict/ext-searchbox'

export interface OutboundRouteXmlEditorHandle {
  /** Moves the cursor/viewport to the given 1-based line. Returns false when out of range. */
  gotoLine: (line: number) => boolean
  /** Total number of lines currently in the document. */
  getLineCount: () => number
}

export interface OutboundRouteXmlEditorProps {
  value: string
  onChange: (value: string) => void
  fontSize: number
  showLineNumbers: boolean
  showInvisibles: boolean
  showIndentGuides: boolean
  readOnly?: boolean
}

const TAB_SIZE = 2

/**
 * Raw dialplan-XML editor, backed by Ace (`react-ace`/`ace-builds`) per explicit instruction —
 * XML mode, `github_dark` theme, and the searchbox extension, matching the Axion reference's own
 * AceEditor choice (unlike the Axion reference, `mode="xml"` is applied for real here — the audit
 * documents Axion's editor as stuck on `mode="text"` even though XML mode is imported, so syntax
 * highlighting never actually applies there; that bug is not reproduced).
 *
 * NOTE ON THEME: `github_dark` is a fixed Ace theme, not derived from Ant Design tokens — it does
 * not follow PepperPBX's light/dark toggle or color presets. This is an explicit, deliberate
 * choice for this screen (matching the Axion reference exactly), not an oversight.
 *
 * `useWorker: false` avoids Ace's web-worker-based background linter, which needs its own worker
 * bundling setup to run under Vite — XML tokenizing/highlighting (mode-xml) does not depend on it,
 * so this only disables background lint annotations, not syntax highlighting.
 */
const OutboundRouteXmlEditor = forwardRef<OutboundRouteXmlEditorHandle, OutboundRouteXmlEditorProps>(
  ({ value, onChange, fontSize, showLineNumbers, showInvisibles, showIndentGuides, readOnly }, ref) => {
    const aceRef = useRef<AceEditor>(null)

    useImperativeHandle(
      ref,
      () => ({
        gotoLine: (line) => {
          const editor = aceRef.current?.editor
          if (!editor) return false
          const totalLines = editor.session.getLength()
          if (!Number.isInteger(line) || line < 1 || line > totalLines) return false
          editor.gotoLine(line, 0, true)
          editor.focus()
          return true
        },
        getLineCount: () => aceRef.current?.editor.session.getLength() ?? 0,
      }),
      []
    )

    return (
      <AceEditor
        ref={aceRef}
        name="outbound-route-xml-editor"
        mode="xml"
        theme="github_dark"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        fontSize={fontSize}
        showGutter={showLineNumbers}
        highlightActiveLine
        wrapEnabled
        tabSize={TAB_SIZE}
        showPrintMargin={false}
        width="100%"
        height="520px"
        setOptions={{
          showLineNumbers,
          showInvisibles,
          displayIndentGuides: showIndentGuides,
          tabSize: TAB_SIZE,
          useWorker: false,
        }}
        editorProps={{ $blockScrolling: true }}
        aria-label="Dialplan XML"
      />
    )
  }
)

OutboundRouteXmlEditor.displayName = 'OutboundRouteXmlEditor'

export default OutboundRouteXmlEditor
