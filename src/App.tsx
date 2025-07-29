import { useState, useEffect } from 'react'
import { Editor } from '@/components/editor/Editor'
import { Sidebar } from '@/components/layout/Sidebar'
import { SearchComponent } from '@/components/search/SearchComponent'
import { CommandPalette } from '@/components/command/CommandPalette'
import type { CommandAction } from '@/components/command/CommandPalette'
import { Button } from '@/components/ui/button'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import type { FileEntry } from '@/lib/utils'
import { initializeDB, saveNote, loadNote, getAllNotes, deleteNote } from '@/lib/database/client'
import { Menu, Save, Search, Command, Plus, Trash2 } from 'lucide-react'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeFile, setActiveFile] = useState<string>()
  const [currentContent, setCurrentContent] = useState('')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Auto-save functionality
  const { saveNow } = useAutoSave({
    content: currentContent,
    onSave: async (content) => {
      if (activeFile) {
        await saveNote(activeFile, content)
      }
    },
    delay: 2000,
    enabled: !!activeFile
  })

  // Define command actions
  const commands: CommandAction[] = [
    {
      id: 'new-note',
      label: 'New Note',
      description: 'Create a new note',
      icon: <Plus className="h-4 w-4" />,
      action: () => handleCreateNote(),
      shortcut: '⌘N',
      group: 'File'
    },
    {
      id: 'search',
      label: 'Search Notes',
      description: 'Search through all notes',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        setCommandPaletteOpen(false)
        setSearchOpen(true)
      },
      shortcut: '⌘F',
      group: 'Navigation'
    },
    {
      id: 'save',
      label: 'Save Note',
      description: 'Save the current note',
      icon: <Save className="h-4 w-4" />,
      action: () => handleSave(),
      shortcut: '⌘S',
      group: 'File'
    },
    {
      id: 'delete-note',
      label: 'Delete Note',
      description: 'Delete the current note',
      icon: <Trash2 className="h-4 w-4" />,
      action: () => handleDeleteNote(),
      shortcut: '⌘⌫',
      group: 'File'
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      icon: <Menu className="h-4 w-4" />,
      action: () => setSidebarOpen(!sidebarOpen),
      shortcut: '⌘B',
      group: 'View'
    }
  ]

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => {
        // Priority: close search first, then command palette
        if (searchOpen) {
          setSearchOpen(false)
        } else if (commandPaletteOpen) {
          setCommandPaletteOpen(false)
        }
      },
      description: 'Close modals'
    },
    {
      key: 'k',
      metaKey: true,
      action: () => {
        setSearchOpen(false) // Close search if open
        setCommandPaletteOpen(true)
      },
      description: 'Open command palette'
    },
    {
      key: 'f',
      metaKey: true,
      action: () => {
        setCommandPaletteOpen(false) // Close command palette if open
        setSearchOpen(true)
      },
      description: 'Open search'
    },
    {
      key: 'n',
      metaKey: true,
      action: () => handleCreateNote(),
      description: 'Create new note'
    },
    {
      key: 'b',
      metaKey: true,
      action: () => setSidebarOpen(!sidebarOpen),
      description: 'Toggle sidebar'
    },
    {
      key: 's',
      metaKey: true,
      action: () => handleSave(),
      description: 'Save note'
    }
  ])

  useEffect(() => {
    // Initialize database and load notes
    initializeDB().then(async () => {
      const notes = await getAllNotes()
      const fileEntries: FileEntry[] = notes
        .filter(note => !note.isFolder)
        .map(note => ({
          name: note.name || 'Untitled',
          path: note.path,
          isFolder: false,
          size: note.size ? Number(note.size) : 0,
          createdAt: note.createdAt || new Date(),
          updatedAt: note.updatedAt || new Date()
        }))
      
      setFiles(fileEntries)
      setIsLoading(false)
      
      // Select first file by default
      if (fileEntries.length > 0) {
        const firstFile = fileEntries[0]
        setActiveFile(firstFile.path)
        const noteData = await loadNote(firstFile.path)
        setCurrentContent(noteData?.content || '')
      } else {
        // Create a welcome note if no notes exist
        const welcomePath = '/welcome.md'
        const welcomeContent = '# Welcome to Haptic Notes\n\nStart writing your notes here!\n\n## Features\n\n- **Search**: Press ⌘F to search through all your notes\n- **Command Palette**: Press ⌘K for quick actions\n- **Auto-save**: Your notes are automatically saved\n- **Rich Text**: Full markdown support with TipTap editor\n\nEnjoy your note-taking experience!'
        await saveNote(welcomePath, welcomeContent, 'Welcome')
        setActiveFile(welcomePath)
        setCurrentContent(welcomeContent)
        setFiles([{
          name: 'Welcome',
          path: welcomePath,
          isFolder: false,
          size: welcomeContent.length,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      }
    })
  }, [])

  const handleFileSelect = async (path: string) => {
    // Save current file before switching
    if (activeFile && currentContent) {
      await saveNote(activeFile, currentContent)
    }
    
    setActiveFile(path)
    const noteData = await loadNote(path)
    setCurrentContent(noteData?.content || '')
  }

  const handleSave = async () => {
    if (!activeFile) return
    
    try {
      await saveNow()
      console.log('Saved:', activeFile)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  async function handleCreateNote() {
    const noteName = prompt('Note name:')
    if (noteName) {
      const newPath = `/${noteName.replace(/\s+/g, '-').toLowerCase()}.md`
      const newContent = `# ${noteName}\n\n`
      
      await saveNote(newPath, newContent, noteName)
      
      const newFile: FileEntry = {
        name: noteName,
        path: newPath,
        isFolder: false,
        size: newContent.length,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setFiles(prev => [...prev, newFile])
      setActiveFile(newPath)
      setCurrentContent(newContent)
    }
  }

  const handleCreateFolder = () => {
    const folderName = prompt('Folder name:')
    if (folderName) {
      // Folder creation logic
      console.log('Creating folder:', folderName)
    }
  }

  async function handleDeleteNote() {
    if (!activeFile) return
    
    const confirmed = confirm('Are you sure you want to delete this note?')
    if (confirmed) {
      try {
        await deleteNote(activeFile)
        setFiles(prev => prev.filter(file => file.path !== activeFile))
        
        // Select another file or clear editor
        const remainingFiles = files.filter(file => file.path !== activeFile)
        if (remainingFiles.length > 0) {
          const nextFile = remainingFiles[0]
          setActiveFile(nextFile.path)
          const noteData = await loadNote(nextFile.path)
          setCurrentContent(noteData?.content || '')
        } else {
          setActiveFile(undefined)
          setCurrentContent('')
        }
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    }
  }

  const handleSearchResultSelect = async (result: any) => {
    await handleFileSelect(result.path)
  }

  const getCurrentFileName = () => {
    if (!activeFile) return 'Untitled'
    return activeFile.split('/').pop()?.replace('.md', '') || 'Untitled'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        files={files}
        activeFile={activeFile}
        onFileSelect={handleFileSelect}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                {getCurrentFileName()}
              </h1>
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {files.length} notes
                </span>
                {activeFile && (
                  <span>Auto-saved</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCommandPaletteOpen(false)
                setSearchOpen(true)
              }}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Search (⌘F)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <span className="text-xs text-muted-foreground ml-1">⌘F</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchOpen(false)
                setCommandPaletteOpen(true)
              }}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Commands (⌘K)"
            >
              <Command className="h-4 w-4" />
              <span className="hidden sm:inline">Commands</span>
              <span className="text-xs text-muted-foreground ml-1">⌘K</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-2"
              title="Save (⌘S)"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
              <span className="text-xs text-muted-foreground ml-1">⌘S</span>
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <div className="h-full p-8">
              <Editor
                content={currentContent}
                onChange={setCurrentContent}
                onSave={handleSave}
                placeholder="Start writing..."
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Welcome to Haptic Notes</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-400">Select a note from the sidebar or create a new one to get started.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘K</kbd>
                    <span>Command palette</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘F</kbd>
                    <span>Search notes</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘N</kbd>
                    <span>New note</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Component */}
      <SearchComponent
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onResultSelect={handleSearchResultSelect}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />
    </div>
  )
}

export default App