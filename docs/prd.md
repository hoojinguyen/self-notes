# Haptic v2 - React Web Application
## Product Requirements Document (PRD)

### Overview
This document outlines the requirements for building Haptic v2, a React-based web application inspired by the original Haptic note-taking application. The goal is to create a local-first, privacy-focused markdown note-taking web app that maintains the core philosophy and features of the original while being built with modern React technologies.

---

## 1. Project Analysis - Original Haptic

### 1.1 Tech Stack Analysis

#### **Core Architecture**
- **Framework**: SvelteKit (Multi-app monorepo with Tauri desktop + SvelteKit web)
- **Database**: PGlite (PostgreSQL in browser) with Drizzle ORM
- **UI**: Tailwind CSS + Custom Shadcn/ui-style components
- **Editor**: TipTap v2 with rich extensions
- **State Management**: Svelte stores (writable stores for global state)
- **Desktop**: Tauri (Rust + WebView)
- **Build**: Vite + TypeScript
- **Package Manager**: pnpm with Turborepo workspace

#### **Key Dependencies**
```json
{
  "core": {
    "@electric-sql/pglite": "Local PostgreSQL database",
    "@tiptap/core": "Rich text editor framework",
    "drizzle-orm": "Type-safe ORM",
    "mode-watcher": "Theme detection"
  },
  "ui": {
    "tailwindcss": "Utility-first CSS",
    "bits-ui": "Unstyled UI primitives",
    "lucide-svelte": "Icon library",
    "cmdk-sv": "Command palette"
  },
  "editor": {
    "@tiptap/extension-*": "Editor extensions",
    "tiptap-markdown": "Markdown support",
    "markdown-it": "Markdown parser"
  }
}
```

### 1.2 Core Features Analysis

#### **Note Management**
- ✅ **Collections**: Top-level containers for organizing notes
- ✅ **Hierarchical Structure**: Folders and subfolders for organization
- ✅ **Rich Text Editing**: TipTap-based markdown editor with live preview
- ✅ **Auto-save**: Configurable auto-save with debouncing (default 750ms)
- ✅ **File Operations**: Create, rename, duplicate, delete notes and folders
- ✅ **Search**: Full-text search across all notes in collection
- ✅ **Recent History**: Track recently opened notes

#### **Editor Features**
- ✅ **Markdown Support**: Live markdown editing with rich text output
- ✅ **Extensions**: Typography, task lists, links, tables, code blocks
- ✅ **Keyboard Shortcuts**: Extensive keyboard shortcut system
- ✅ **Character Count**: Word/character counting with reading time estimation
- ✅ **Table of Contents**: Auto-generated TOC from headings
- ✅ **Image Support**: Drag & drop image insertion
- ✅ **Task Lists**: Interactive checkbox lists

#### **UI/UX Features**
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Dark/Light Mode**: System-aware theming with manual override
- ✅ **Resizable Sidebars**: File browser and note details panels
- ✅ **Command Palette**: Keyboard-driven operations (Cmd+K)
- ✅ **Contextual Menus**: Right-click context menus for file operations
- ✅ **File Tree**: Collapsible folder structure with icons
- ✅ **Breadcrumbs**: Navigation breadcrumbs for current location

#### **Advanced Features**
- ✅ **Local-First**: All data stored in browser IndexedDB via PGlite
- ✅ **Privacy-Focused**: No server dependencies, offline-capable
- ✅ **Settings**: Configurable editor preferences and app settings
- ✅ **Export/Import**: Collection import from folder structure
- ✅ **Search Results**: Advanced search with context preview
- ✅ **Task View**: Dedicated view for all incomplete tasks across notes
- ✅ **Daily Notes**: Special daily note organization
- ✅ **Metadata Display**: Creation/modification dates, file sizes

---

## 2. Haptic v2 Requirements

### 2.1 Core Principles
1. **Local-First**: All data must remain in the browser without server dependencies
2. **Privacy-Focused**: Zero data transmission to external servers
3. **Performance-First**: Fast loading, smooth interactions, efficient updates
4. **Accessibility**: Keyboard navigation, screen reader support, semantic HTML
5. **Progressive Enhancement**: Works without JavaScript for basic content

### 2.2 Technology Stack

#### **Required Stack**
```json
{
  "framework": "React 18 + TypeScript",
  "build": "Vite",
  "database": "PGlite + Drizzle ORM", 
  "styling": "Tailwind CSS v3",
  "editor": "TipTap v2",
  "state": "React hooks + Context API",
  "icons": "Lucide React",
  "ui": "Custom components based on Shadcn/ui patterns"
}
```

#### **Rationale for React Choice**
- **Performance**: React 18 concurrent features for smooth UX
- **Ecosystem**: Rich ecosystem of libraries and tools
- **Developer Experience**: Excellent TypeScript integration
- **Component Architecture**: Reusable, maintainable component system
- **Hooks**: Modern state management with useCallback, useMemo optimization

### 2.3 Functional Requirements

#### **Phase 1: Core Features (MVP)**
1. **Database Setup**
   - [ ] PGlite initialization and migration system
   - [ ] Drizzle ORM schema for collections, entries, settings
   - [ ] Database operations: CRUD for notes and folders

2. **Basic Note Management**
   - [ ] Create, edit, delete, rename notes
   - [ ] Create, delete, rename folders
   - [ ] File tree navigation with expand/collapse
   - [ ] Auto-save functionality with debouncing

3. **TipTap Editor Integration**
   - [ ] Basic rich text editing with markdown output
   - [ ] Essential extensions: headings, lists, links, bold/italic
   - [ ] Keyboard shortcuts for common operations
   - [ ] Word/character count display

4. **UI Framework**
   - [ ] Responsive layout with sidebar + main content
   - [ ] Dark/light theme support with system detection
   - [ ] Basic file tree with icons
   - [ ] Loading states and error handling

#### **Phase 2: Enhanced Features**
1. **Advanced Editor**
   - [ ] Task lists with interactive checkboxes
   - [ ] Tables, code blocks, images
   - [ ] Table of contents generation
   - [ ] Advanced markdown features

2. **Search & Navigation**
   - [ ] Full-text search across all notes
   - [ ] Search results with context preview
   - [ ] Command palette (Cmd+K) for quick actions
   - [ ] Recent notes history

3. **Enhanced UI**
   - [ ] Resizable sidebars
   - [ ] Context menus for file operations
   - [ ] Drag & drop file operations
   - [ ] Note metadata display

#### **Phase 3: Advanced Features**
1. **Collections Management**
   - [ ] Multiple collections support
   - [ ] Collection switching
   - [ ] Import/export functionality
   - [ ] Settings per collection

2. **Advanced Views**
   - [ ] Task view (all incomplete tasks)
   - [ ] Daily notes support
   - [ ] Calendar integration
   - [ ] Graph view for linked notes

3. **Productivity Features**
   - [ ] Advanced search filters
   - [ ] Note linking and backlinks
   - [ ] Templates system
   - [ ] Keyboard shortcut customization

### 2.4 Technical Requirements

#### **Performance Requirements**
- [ ] Initial page load < 2 seconds
- [ ] Note switching < 200ms
- [ ] Search results < 500ms
- [ ] Auto-save debounce < 1 second
- [ ] Smooth 60fps interactions

#### **Browser Compatibility**
- [ ] Chrome/Edge 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

#### **Data Requirements**
- [ ] Support for 10,000+ notes per collection
- [ ] Individual notes up to 10MB
- [ ] Efficient indexing for fast search
- [ ] Automatic database optimization

#### **Accessibility Requirements**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation for all features
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Focus management and indicators

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Collections (top-level containers)
CREATE TABLE collection (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_opened TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection-specific settings
CREATE TABLE collection_settings (
  id TEXT PRIMARY KEY,
  collection_path TEXT REFERENCES collection(path),
  editor_font TEXT DEFAULT 'system-ui',
  editor_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT true,
  auto_save_debounce INTEGER DEFAULT 750,
  show_line_numbers BOOLEAN DEFAULT false,
  show_toolbar BOOLEAN DEFAULT true
);

-- Notes and folders
CREATE TABLE entry (
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
```

### 3.2 Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_entry_collection_path ON entry(collection_path);
CREATE INDEX idx_entry_parent_path ON entry(parent_path);
CREATE INDEX idx_entry_updated_at ON entry(updated_at);
CREATE INDEX idx_entry_is_folder ON entry(is_folder);

-- Full-text search
CREATE INDEX idx_entry_content_fts ON entry USING gin(to_tsvector('english', content));
```

---

## 4. Component Architecture

### 4.1 Core Components Structure

```
src/
├── components/
│   ├── editor/
│   │   ├── Editor.tsx              # Main TipTap editor
│   │   ├── EditorToolbar.tsx       # Editor toolbar
│   │   └── EditorExtensions.ts     # TipTap extensions config
│   ├── layout/
│   │   ├── Layout.tsx              # Main app layout
│   │   ├── Sidebar.tsx             # File tree sidebar
│   │   ├── Header.tsx              # Top header bar
│   │   └── StatusBar.tsx           # Bottom status bar
│   ├── file-tree/
│   │   ├── FileTree.tsx            # File tree component
│   │   ├── FileNode.tsx            # Individual file/folder node
│   │   └── ContextMenu.tsx         # Right-click context menu
│   ├── search/
│   │   ├── SearchBar.tsx           # Search input
│   │   ├── SearchResults.tsx       # Search results display
│   │   └── CommandPalette.tsx      # Cmd+K command palette
│   ├── ui/
│   │   ├── Button.tsx              # Reusable button
│   │   ├── Input.tsx               # Input components
│   │   ├── Modal.tsx               # Modal dialogs
│   │   ├── Tooltip.tsx             # Tooltip component
│   │   └── Spinner.tsx             # Loading spinner
│   └── settings/
│       ├── SettingsModal.tsx       # Settings dialog
│       ├── ThemeToggle.tsx         # Theme switcher
│       └── EditorSettings.tsx      # Editor preferences
├── hooks/
│   ├── useDatabase.ts              # Database operations
│   ├── useSearch.ts                # Search functionality
│   ├── useTheme.ts                 # Theme management
│   ├── useKeyboardShortcuts.ts     # Keyboard shortcuts
│   └── useAutoSave.ts              # Auto-save logic
├── lib/
│   ├── database/
│   │   ├── client.ts               # PGlite client setup
│   │   ├── schema.ts               # Drizzle schema
│   │   └── migrations.ts           # Database migrations
│   ├── editor/
│   │   ├── extensions.ts           # TipTap extensions
│   │   └── shortcuts.ts            # Editor shortcuts
│   └── utils/
│       ├── file-operations.ts      # File/folder operations
│       ├── search.ts               # Search utilities
│       └── theme.ts                # Theme utilities
└── types/
    ├── database.ts                 # Database types
    ├── editor.ts                   # Editor types
    └── ui.ts                       # UI component types
```

### 4.2 State Management Strategy

```typescript
// Context-based state management
interface AppState {
  // Current state
  activeFile: string | null;
  currentCollection: string | null;
  
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Editor state
  editorContent: string;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  
  // File tree state
  fileTree: FileNode[];
  expandedFolders: Set<string>;
}
```

---

## 5. Implementation Plan

### 5.1 Development Phases

#### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Project setup with Vite + React + TypeScript
- [ ] PGlite integration and database schema
- [ ] Basic UI layout with Tailwind CSS
- [ ] Core database operations (CRUD)
- [ ] Basic file tree navigation
- [ ] Simple text editing (no TipTap yet)

#### **Phase 2: Core Features (Weeks 3-4)**
- [ ] TipTap editor integration
- [ ] Auto-save functionality
- [ ] File operations (create, rename, delete)
- [ ] Basic search functionality
- [ ] Theme system implementation
- [ ] Keyboard shortcuts setup

#### **Phase 3: Enhanced UI (Weeks 5-6)**
- [ ] Advanced TipTap extensions
- [ ] Command palette implementation
- [ ] Context menus for file operations
- [ ] Resizable sidebars
- [ ] Search results with context
- [ ] Note metadata display

#### **Phase 4: Advanced Features (Weeks 7-8)**
- [ ] Collections management
- [ ] Import/export functionality
- [ ] Advanced search filters
- [ ] Task view implementation
- [ ] Settings and preferences
- [ ] Performance optimizations

#### **Phase 5: Polish & Testing (Weeks 9-10)**
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] Documentation and user guides
- [ ] Browser testing and compatibility
- [ ] Final UI polish and animations

### 5.2 Success Metrics

#### **Technical Metrics**
- [ ] Page load time < 2 seconds
- [ ] Search response time < 500ms
- [ ] Note switching time < 200ms
- [ ] 0 accessibility violations (WAVE/axe)
- [ ] TypeScript strict mode with 0 errors
- [ ] 90+ Lighthouse performance score

#### **Functional Metrics**
- [ ] All core features from original Haptic implemented
- [ ] Supports 1000+ notes without performance degradation
- [ ] Works offline with full functionality
- [ ] Mobile responsive on all major devices
- [ ] Cross-browser compatibility verified

#### **User Experience Metrics**
- [ ] Smooth 60fps interactions
- [ ] Intuitive keyboard navigation
- [ ] Consistent visual design system
- [ ] Clear error messages and feedback
- [ ] Fast and accurate search results

---

## 6. File Structure

```
haptic-v2/
├── docs/
│   ├── prd.md                      # This document
│   ├── tech-specs.md               # Technical specifications
│   ├── api-reference.md            # Database API reference
│   └── user-guide.md               # User documentation
├── src/
│   ├── components/                 # React components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Core utilities and setup
│   ├── types/                      # TypeScript type definitions
│   ├── styles/                     # Global styles and CSS
│   └── App.tsx                     # Main application component
├── public/                         # Static assets
├── tests/                          # Test files
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Project overview
```

---

This PRD serves as the comprehensive guide for building Haptic v2 as a React web application while maintaining the core functionality and user experience of the original Svelte-based Haptic application.
