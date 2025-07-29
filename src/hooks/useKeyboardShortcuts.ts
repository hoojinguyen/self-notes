import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs or contentEditable elements
    const target = event.target as HTMLElement
    const isInEditor = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.contentEditable === 'true' ||
                      target.closest('.ProseMirror')

    // Allow certain shortcuts even in editor (like save)
    const allowedInEditor = ['s', 'f', 'k']
    const shouldPreventInEditor = isInEditor && !allowedInEditor.includes(event.key.toLowerCase())
    
    if (shouldPreventInEditor) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const metaMatches = !!shortcut.metaKey === event.metaKey
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const altMatches = !!shortcut.altKey === event.altKey

      if (keyMatches && metaMatches && ctrlMatches && shiftMatches && altMatches) {
        console.log('Keyboard shortcut triggered:', shortcut.description)
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Utility function to format shortcut display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts = []
  
  if (shortcut.metaKey) parts.push('⌘')
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.shiftKey) parts.push('Shift')
  
  parts.push(shortcut.key.toUpperCase())
  
  return parts.join('+')
}
