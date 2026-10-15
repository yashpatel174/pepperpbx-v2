import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { App } from 'antd'

/**
 * Warns before unsaved edits are lost: an in-app navigation is held behind a confirm dialog, and
 * a tab close/refresh gets the browser's native prompt. Pass `dirty=false` (e.g. right after a
 * successful save) and navigation flows through untouched.
 */
const useUnsavedChangesGuard = (dirty: boolean) => {
  const { modal } = App.useApp()
  const blocker = useBlocker(dirty)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You have unsaved changes on this page. If you leave now they will be lost.',
      okText: 'Discard and leave',
      okButtonProps: { danger: true },
      cancelText: 'Stay',
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    })
  }, [blocker, modal])

  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}

export default useUnsavedChangesGuard
