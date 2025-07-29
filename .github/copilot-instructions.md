<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Haptic Notes - React Web Application

This is a local-first, privacy-focused note-taking web application built with React, inspired by the original Haptic project.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PGlite (PostgreSQL in browser) + Drizzle ORM
- **Styling**: Tailwind CSS with CSS variables for theming
- **Editor**: TipTap with markdown support
- **UI Components**: Custom components based on Shadcn/ui patterns
- **Icons**: Lucide React

## Architecture Principles
- **Local-first**: All data stored in browser (IndexedDB via PGlite)
- **Privacy-focused**: No server dependencies for core functionality
- **Type-safe**: Full TypeScript coverage
- **Modern React**: Hooks, functional components, proper state management

## Code Style Guidelines
- Use functional components with hooks
- Prefer TypeScript interfaces over types for objects
- Use `@/` path aliases for imports
- Follow Tailwind utility-first approach
- Use proper type imports with `import type` when needed
- Implement proper error handling for database operations
- Use semantic HTML and accessibility best practices

## Key Features to Implement
- Rich markdown editor with TipTap
- File tree navigation with folders
- Local database operations (CRUD)
- Search functionality
- Auto-save with debouncing
- Keyboard shortcuts
- Theme switching (light/dark)
- Export/import functionality

## Database Schema
- `collection`: Note collections/folders
- `collection_settings`: User preferences per collection
- `entry`: Individual notes and folder structure

Please maintain consistency with the existing code patterns and ensure all new features follow the local-first architecture principle.
