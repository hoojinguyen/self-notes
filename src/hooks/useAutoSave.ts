import { useEffect, useCallback, useRef } from 'react'

interface UseAutoSaveOptions {
  content: string
  onSave: (content: string) => Promise<void> | void
  delay?: number
  enabled?: boolean
}

export function useAutoSave({ 
  content, 
  onSave, 
  delay = 2000, 
  enabled = true 
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>('')
  const isSavingRef = useRef(false)

  const debouncedSave = useCallback(async () => {
    if (isSavingRef.current || !enabled) return
    
    const contentToSave = content.trim()
    
    // Don't save if content hasn't changed
    if (contentToSave === lastSavedContentRef.current) return
    
    try {
      isSavingRef.current = true
      await onSave(contentToSave)
      lastSavedContentRef.current = contentToSave
      console.log('Auto-saved note')
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      isSavingRef.current = false
    }
  }, [content, onSave, enabled])

  useEffect(() => {
    if (!enabled || !content.trim()) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(debouncedSave, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, delay, enabled, debouncedSave])

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await debouncedSave()
  }, [debouncedSave])

  return { saveNow, isSaving: isSavingRef.current }
}
