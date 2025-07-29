import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { FileEntry } from '@/lib/utils'
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  Plus, 
  Search,
  Settings,
  Menu
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  files: FileEntry[]
  activeFile?: string
  onFileSelect: (path: string) => void
  onCreateNote: () => void
  onCreateFolder: () => void
}

export function Sidebar({ 
  isOpen, 
  onToggle, 
  files, 
  activeFile, 
  onFileSelect, 
  onCreateNote,
  onCreateFolder 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileTree = (entries: FileEntry[], level = 0) => {
    return entries
      .filter(entry => 
        searchQuery === '' || 
        entry.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(entry => (
        <div key={entry.path}>
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent group",
              activeFile === entry.path && "bg-accent",
              level > 0 && "ml-4"
            )}
            onClick={() => {
              if (entry.isFolder) {
                toggleFolder(entry.path)
              } else {
                onFileSelect(entry.path)
              }
            }}
          >
            {entry.isFolder ? (
              expandedFolders.has(entry.path) ? 
                <FolderOpen className="h-4 w-4 text-muted-foreground" /> : 
                <Folder className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm truncate flex-1">{entry.name}</span>
          </div>
          {entry.isFolder && expandedFolders.has(entry.path) && entry.children && (
            <div>
              {renderFileTree(entry.children, level + 1)}
            </div>
          )}
        </div>
      ))
  }

  return (
    <div
      className={cn(
        "bg-secondary/30 border-r transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateNote}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Note
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateFolder}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Folder
          </Button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {renderFileTree(files)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}
