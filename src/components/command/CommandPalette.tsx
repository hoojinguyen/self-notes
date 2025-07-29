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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh] z-50">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-96 flex flex-col">
        <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="relative">
            <Command className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 h-12 text-base bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`mx-2 mb-1 p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-2 border-transparent'
                  }`}
                  onClick={() => executeCommand(command)}
                >
                  <div className="flex items-center gap-3">
                    {command.icon && (
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <div className="w-5 h-5 text-blue-600 dark:text-blue-400">
                          {command.icon}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{command.label}</div>
                      {command.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {command.shortcut && (
                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg text-xs font-mono">
                      {command.shortcut}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Command className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                {query ? `No commands found for "${query}"` : 'No commands available'}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Quick actions & navigation</span>
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
