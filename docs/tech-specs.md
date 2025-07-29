# Haptic v2 - Technical Specifications

## Overview
This document provides detailed technical specifications for implementing Haptic v2, including architecture decisions, API design, and implementation guidelines.

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                       │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Hooks  │  Context  │  Utils  │  Types      │
├─────────────────────────────────────────────────────────────┤
│                     TipTap Editor                           │
├─────────────────────────────────────────────────────────────┤
│                    Drizzle ORM                              │
├─────────────────────────────────────────────────────────────┤
│                     PGlite Database                         │
├─────────────────────────────────────────────────────────────┤
│                    Browser IndexedDB                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User Action → React Component → Hook → Database Operation → State Update → UI Re-render
     ↓              ↓             ↓           ↓              ↓           ↓
  Click Edit → Editor.tsx → useEditor → updateNote() → setContent → TipTap Update
```

---

## 2. Database Design

### 2.1 Schema Definition

```typescript
// src/lib/database/schema.ts
import { text, integer, boolean, timestamp } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

export const collection = sqliteTable('collection', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastOpened: timestamp('last_opened').defaultNow(),
});

export const collectionSettings = sqliteTable('collection_settings', {
  id: text('id').primaryKey(),
  collectionPath: text('collection_path').references(() => collection.path),
  editorFont: text('editor_font').default('system-ui'),
  editorSize: integer('editor_size').default(14),
  autoSave: boolean('auto_save').default(true),
  autoSaveDebounce: integer('auto_save_debounce').default(750),
  showLineNumbers: boolean('show_line_numbers').default(false),
  showToolbar: boolean('show_toolbar').default(true),
});

export const entry = sqliteTable('entry', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').unique().notNull(),
  parentPath: text('parent_path'),
  collectionPath: text('collection_path').references(() => collection.path),
  content: text('content'),
  isFolder: boolean('is_folder').default(false),
  size: integer('size').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 2.2 Database Client Setup

```typescript
// src/lib/database/client.ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

let db: ReturnType<typeof drizzle>;
let pgClient: PGlite;

export async function initializeDB() {
  if (!pgClient) {
    pgClient = new PGlite();
    db = drizzle(pgClient, { schema });
    
    // Run migrations
    await runMigrations();
  }
  
  return { db, pgClient };
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return db;
}

async function runMigrations() {
  // Migration logic here
  const migrationSQL = `
    CREATE TABLE IF NOT EXISTS collection (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_opened TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS collection_settings (
      id TEXT PRIMARY KEY,
      collection_path TEXT REFERENCES collection(path),
      editor_font TEXT DEFAULT 'system-ui',
      editor_size INTEGER DEFAULT 14,
      auto_save BOOLEAN DEFAULT true,
      auto_save_debounce INTEGER DEFAULT 750,
      show_line_numbers BOOLEAN DEFAULT false,
      show_toolbar BOOLEAN DEFAULT true
    );
    
    CREATE TABLE IF NOT EXISTS entry (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      parent_path TEXT,
      collection_path TEXT REFERENCES collection(path),
      content TEXT,
      is_folder BOOLEAN DEFAULT false,
      size INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_entry_collection_path ON entry(collection_path);
    CREATE INDEX IF NOT EXISTS idx_entry_parent_path ON entry(parent_path);
    CREATE INDEX IF NOT EXISTS idx_entry_updated_at ON entry(updated_at);
  `;
  
  await pgClient.exec(migrationSQL);
}
```

---

## 3. Component Architecture

### 3.1 Core Components

#### Editor Component
```typescript
// src/components/editor/Editor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Typography } from '@tiptap/extension-typography';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Link } from '@tiptap/extension-link';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export function Editor({ content, onChange, onSave, readOnly = false }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !readOnly,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  return (
    <div className="editor-container">
      <EditorContent editor={editor} />
      {editor && (
        <div className="editor-status">
          {editor.storage.characterCount.words()} words, 
          {editor.storage.characterCount.characters()} characters
        </div>
      )}
    </div>
  );
}
```

#### File Tree Component
```typescript
// src/components/file-tree/FileTree.tsx
interface FileTreeProps {
  files: FileEntry[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  onFileCreate: (parentPath: string, name: string) => void;
  onFileRename: (path: string, newName: string) => void;
  onFileDelete: (path: string) => void;
}

export function FileTree({ 
  files, 
  activeFile, 
  onFileSelect, 
  onFileCreate, 
  onFileRename, 
  onFileDelete 
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="file-tree">
      {files.map(file => (
        <FileNode
          key={file.path}
          file={file}
          isActive={activeFile === file.path}
          isExpanded={expandedFolders.has(file.path)}
          onSelect={onFileSelect}
          onToggle={toggleFolder}
          onRename={onFileRename}
          onDelete={onFileDelete}
        />
      ))}
    </div>
  );
}
```

### 3.2 Custom Hooks

#### Database Operations Hook
```typescript
// src/hooks/useDatabase.ts
export function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);
  
  useEffect(() => {
    initializeDB().then(({ db }) => setDb(db));
  }, []);

  const createNote = useCallback(async (parentPath: string, name: string) => {
    if (!db) throw new Error('Database not initialized');
    
    const path = `${parentPath}/${name}`.replace('//', '/');
    const id = nanoid();
    
    await db.insert(entry).values({
      id,
      name,
      path,
      parentPath,
      content: '',
      isFolder: false,
    });
    
    return path;
  }, [db]);

  const updateNote = useCallback(async (path: string, content: string) => {
    if (!db) throw new Error('Database not initialized');
    
    await db
      .update(entry)
      .set({ 
        content, 
        updatedAt: new Date(),
        size: new TextEncoder().encode(content).length 
      })
      .where(eq(entry.path, path));
  }, [db]);

  const deleteNote = useCallback(async (path: string) => {
    if (!db) throw new Error('Database not initialized');
    
    await db.delete(entry).where(eq(entry.path, path));
  }, [db]);

  const getNote = useCallback(async (path: string) => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db
      .select()
      .from(entry)
      .where(eq(entry.path, path))
      .limit(1);
    
    return result[0] || null;
  }, [db]);

  return {
    createNote,
    updateNote,
    deleteNote,
    getNote,
    isReady: !!db,
  };
}
```

#### Auto-Save Hook
```typescript
// src/hooks/useAutoSave.ts
export function useAutoSave(
  content: string,
  filePath: string | null,
  delay: number = 750
) {
  const { updateNote } = useDatabase();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debouncedSave = useMemo(
    () => debounce(async (content: string, path: string) => {
      setIsSaving(true);
      try {
        await updateNote(path, content);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay),
    [updateNote, delay]
  );

  useEffect(() => {
    if (filePath && content) {
      setHasUnsavedChanges(true);
      debouncedSave(content, filePath);
    }
  }, [content, filePath, debouncedSave]);

  const forceSave = useCallback(async () => {
    if (filePath && content) {
      debouncedSave.cancel();
      setIsSaving(true);
      try {
        await updateNote(filePath, content);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Force save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [filePath, content, updateNote, debouncedSave]);

  return {
    isSaving,
    hasUnsavedChanges,
    forceSave,
  };
}
```

#### Search Hook
```typescript
// src/hooks/useSearch.ts
export function useSearch() {
  const { db } = useDatabase();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!db || !query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await db
        .select({
          path: entry.path,
          name: entry.name,
          content: entry.content,
        })
        .from(entry)
        .where(
          and(
            eq(entry.isFolder, false),
            or(
              like(entry.name, `%${query}%`),
              like(entry.content, `%${query}%`)
            )
          )
        )
        .limit(50);

      const processedResults = searchResults.map(result => ({
        ...result,
        contextPreview: extractContext(result.content || '', query),
        matchType: result.name.toLowerCase().includes(query.toLowerCase()) 
          ? 'title' : 'content'
      }));

      setResults(processedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [db]);

  const debouncedSearch = useMemo(
    () => debounce(search, 300),
    [search]
  );

  return {
    search: debouncedSearch,
    results,
    isSearching,
    clearResults: () => setResults([]),
  };
}

function extractContext(content: string, query: string, contextLength = 100): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return content.substring(0, contextLength);
  
  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(content.length, index + query.length + contextLength / 2);
  
  return content.substring(start, end);
}
```

---

## 4. State Management

### 4.1 App Context
```typescript
// src/context/AppContext.tsx
interface AppContextType {
  // Current state
  activeFile: string | null;
  currentCollection: string | null;
  
  // UI state
  sidebarOpen: boolean;
  theme: Theme;
  
  // File operations
  openFile: (path: string) => void;
  createFile: (parentPath: string, name: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (path: string, newName: string) => Promise<void>;
  
  // UI operations
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [currentCollection, setCurrentCollection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  
  const { createNote, deleteNote, updateNote } = useDatabase();

  const openFile = useCallback((path: string) => {
    setActiveFile(path);
  }, []);

  const createFile = useCallback(async (parentPath: string, name: string) => {
    const path = await createNote(parentPath, name);
    setActiveFile(path);
  }, [createNote]);

  const deleteFileHandler = useCallback(async (path: string) => {
    await deleteNote(path);
    if (activeFile === path) {
      setActiveFile(null);
    }
  }, [deleteNote, activeFile]);

  const value: AppContextType = {
    activeFile,
    currentCollection,
    sidebarOpen,
    theme,
    openFile,
    createFile,
    deleteFile: deleteFileHandler,
    renameFile: async (path, newName) => {
      // Implementation for rename
    },
    toggleSidebar: () => setSidebarOpen(prev => !prev),
    setTheme,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

---

## 5. Keyboard Shortcuts

### 5.1 Shortcut System
```typescript
// src/hooks/useKeyboardShortcuts.ts
interface Shortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matches = 
          e.key === shortcut.key &&
          !!e.metaKey === !!shortcut.metaKey &&
          !!e.ctrlKey === !!shortcut.ctrlKey &&
          !!e.shiftKey === !!shortcut.shiftKey &&
          !!e.altKey === !!shortcut.altKey;
        
        if (matches) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global shortcuts
export const globalShortcuts: Shortcut[] = [
  {
    key: 'k',
    metaKey: true,
    action: () => openCommandPalette(),
    description: 'Open command palette',
  },
  {
    key: 'n',
    metaKey: true,
    action: () => createNewNote(),
    description: 'Create new note',
  },
  {
    key: 's',
    metaKey: true,
    action: () => forceSave(),
    description: 'Save current note',
  },
  {
    key: 'b',
    metaKey: true,
    shiftKey: true,
    action: () => toggleSidebar(),
    description: 'Toggle sidebar',
  },
];
```

---

## 6. Performance Optimizations

### 6.1 Component Optimization
```typescript
// Memoization for expensive components
export const FileTree = memo(function FileTree({ files, ...props }) {
  // Component implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.activeFile === nextProps.activeFile &&
    JSON.stringify(prevProps.files) === JSON.stringify(nextProps.files)
  );
});

// Virtual scrolling for large file lists
export function VirtualizedFileTree({ files }: { files: FileEntry[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(50);
  
  const visibleFiles = useMemo(() => 
    files.slice(startIndex, endIndex), 
    [files, startIndex, endIndex]
  );

  return (
    <div className="virtualized-tree">
      {visibleFiles.map(file => (
        <FileNode key={file.path} file={file} />
      ))}
    </div>
  );
}
```

### 6.2 Database Optimization
```typescript
// Indexed queries for fast search
export async function searchNotes(query: string, limit = 50) {
  return await db
    .select()
    .from(entry)
    .where(
      and(
        eq(entry.isFolder, false),
        sql`content MATCH ${query}` // Full-text search
      )
    )
    .limit(limit);
}

// Batch operations for bulk changes
export async function batchUpdateNotes(updates: Array<{ path: string; content: string }>) {
  return await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx
        .update(entry)
        .set({ content: update.content, updatedAt: new Date() })
        .where(eq(entry.path, update.path));
    }
  });
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests
```typescript
// __tests__/useDatabase.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDatabase } from '../hooks/useDatabase';

describe('useDatabase', () => {
  it('should create a note', async () => {
    const { result } = renderHook(() => useDatabase());
    
    await act(async () => {
      const path = await result.current.createNote('/', 'test.md');
      expect(path).toBe('/test.md');
    });
  });

  it('should update note content', async () => {
    const { result } = renderHook(() => useDatabase());
    
    await act(async () => {
      await result.current.createNote('/', 'test.md');
      await result.current.updateNote('/test.md', '# Hello World');
      
      const note = await result.current.getNote('/test.md');
      expect(note?.content).toBe('# Hello World');
    });
  });
});
```

### 7.2 Integration Tests
```typescript
// __tests__/Editor.integration.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Editor } from '../components/editor/Editor';

describe('Editor Integration', () => {
  it('should auto-save content changes', async () => {
    const mockOnChange = jest.fn();
    const mockOnSave = jest.fn();
    
    const { getByRole } = render(
      <Editor 
        content="" 
        onChange={mockOnChange} 
        onSave={mockOnSave}
      />
    );
    
    const editor = getByRole('textbox');
    fireEvent.input(editor, { target: { textContent: 'Hello World' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('<p>Hello World</p>');
    }, { timeout: 1000 });
  });
});
```

---

## 8. Error Handling

### 8.1 Error Boundaries
```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to external service in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 8.2 Database Error Handling
```typescript
// src/lib/database/error-handling.ts
export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function withErrorHandling<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new DatabaseError(
        `Failed to ${operation}`,
        operation,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };
}
```

---

This technical specification provides the detailed implementation guidelines for building Haptic v2 as a React web application with all the core features and performance optimizations needed for a production-ready note-taking application.
