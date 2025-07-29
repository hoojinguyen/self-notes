import React, { useState, useRef, useEffect } from 'react'
import { Command } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface CommandAction {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  action: () => void
  shortcut?: string
  group?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: CommandAction[]
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.description?.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
        }
        break
    }
  }

  const executeCommand = (command: CommandAction) => {
    command.action()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-96 flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Command className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                    index === selectedIndex
                      ? 'bg-muted text-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => executeCommand(command)}
                >
                  <div className="flex items-center gap-3">
                    {command.icon && (
                      <div className="w-4 h-4 text-muted-foreground">
                        {command.icon}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{command.label}</div>
                      {command.description && (
                        <div className="text-sm text-muted-foreground">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {command.shortcut && (
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {command.shortcut}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {query ? `No commands found for "${query}"` : 'No commands available'}
            </div>
          )}
        </div>

        <div className="p-2 border-t text-xs text-muted-foreground text-center">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  )
}
