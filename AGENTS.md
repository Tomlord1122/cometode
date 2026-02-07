# AGENTS.md - Coding Agent Instructions

This document provides instructions for AI coding agents working on the Cometode codebase.

## Project Overview

Cometode is a macOS menu bar app for tracking coding problem practice using spaced repetition. It uses Electron + Svelte 5 + TypeScript + Tailwind CSS 4 + better-sqlite3.

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                 # Start dev server with hot reload
pnpm start               # Preview production build

# Type Checking
pnpm typecheck           # Full typecheck (TypeScript + Svelte)
pnpm typecheck:node      # TypeScript check for main/preload only
pnpm svelte-check        # Svelte-specific type checking

# Linting & Formatting
pnpm lint                # Run ESLint with cache
pnpm format              # Run Prettier on all files

# Building
pnpm build               # Production build (runs typecheck first)
pnpm build:mac           # Build macOS app (.dmg + .zip)
pnpm build:win           # Build Windows app
pnpm build:linux         # Build Linux app
```

### Testing

**No test framework is currently configured.** If adding tests:

- Use Vitest (Vite-compatible)
- Use Playwright for E2E Electron testing
- Place tests in `__tests__/` directories or use `.test.ts` suffix

## Code Style Guidelines

### Formatting (Prettier)

- **No semicolons** - `semi: false`
- **Single quotes** - `singleQuote: true`
- **No trailing commas** - `trailingComma: none`
- **100 character line width** - `printWidth: 100`

### Import Organization

Order imports as follows, with blank lines between groups:

```typescript
// 1. Electron/external dependencies
import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'

// 2. Third-party libraries
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'

// 3. Local modules (relative imports)
import { initDatabase, getDatabase } from './db'
import { setupIPC } from './ipc'
```

### Naming Conventions

| Element             | Convention           | Example                                                |
| ------------------- | -------------------- | ------------------------------------------------------ |
| Files/directories   | kebab-case           | `src/main/lib/cir.ts`                                  |
| Svelte components   | PascalCase           | `HomeView.svelte`                                      |
| Variables/functions | camelCase            | `loadProblems`, `popupWindow`                          |
| Constants           | SCREAMING_SNAKE_CASE | `MAX_INTERVAL_DAYS`, `POPUP_WIDTH`                     |
| Types/interfaces    | PascalCase           | `Problem`, `ProblemFilters`                            |
| Type aliases        | PascalCase           | `type ProblemSet = 'neetcode150' \| 'google' \| 'all'` |

### TypeScript

- Use explicit types for function parameters and return types
- Prefer interfaces over type aliases for object shapes
- Export types from `src/preload/index.d.ts` for shared types

```typescript
// Good - explicit types
export async function loadProblems(filters?: ProblemFilters): Promise<void> {
  // ...
}

// Good - interface for object shape
interface ReviewSubmission {
  problemId: number
  quality: number
}
```

### Error Handling

Use try-catch with console.error and provide fallback behavior:

```typescript
try {
  const result = await window.api.submitReview({ problemId, quality })
  return result
} catch (error) {
  console.error('Failed to submit review:', error)
  return { success: false, nextReviewDate: '', newInterval: 0 }
}
```

### Svelte 5 Patterns (Runes)

Always use Svelte 5 runes syntax:

```svelte
<script lang="ts">
  // Props - use $props()
  interface Props {
    problem: Problem
    onBack: () => void
  }
  let { problem, onBack }: Props = $props()

  // State - use $state
  let isSubmitting = $state(false)
  let showSuccess = $state(false)

  // Derived values - use $derived
  const categories = $derived(JSON.parse(problem.categories || '[]') as string[])

  // Effects - use $effect
  $effect(() => {
    filterUIState.set({ searchText, selectedDifficulties, showDueOnly, showFilterMenu })
  })
</script>
```

### Svelte Stores

Use `writable` and `derived` from `svelte/store`:

```typescript
import { writable, derived } from 'svelte/store'

export const problems = writable<Problem[]>([])
export const problemCounts = derived(problems, ($problems) => ({
  total: $problems.length,
  practiced: $problems.filter((p) => p.total_reviews > 0).length
}))
```

### IPC Communication Pattern

**Main process** (`src/main/ipc.ts`):

```typescript
ipcMain.handle('get-problems', (_event, filters?: ProblemFilters) => {
  return db.prepare(query).all(...params)
})
```

**Preload bridge** (`src/preload/index.ts`):

```typescript
const api = {
  getProblems: (filters?: ProblemFilters) => ipcRenderer.invoke('get-problems', filters)
}
```

**Renderer** (`src/renderer/src/`):

```typescript
const problems = await window.api.getProblems(filters)
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # Tray, popup, auto-updater
│   ├── ipc.ts      # IPC handlers (30+)
│   ├── db/         # Database schema, migrations, seed
│   └── lib/        # Algorithms (CIR spaced repetition)
├── preload/        # Electron preload scripts
│   ├── index.ts    # API bridge
│   └── index.d.ts  # Shared type definitions
└── renderer/src/   # Svelte frontend
    ├── App.svelte  # Main app, settings, routing
    ├── stores/     # Svelte stores
    └── components/ # UI components
```

## Key Files to Understand

- `src/preload/index.d.ts` - All shared types and API interface
- `src/main/ipc.ts` - All IPC handlers
- `src/main/lib/cir.ts` - Spaced repetition algorithm
- `src/renderer/src/stores/problems.ts` - Problem state management
- `CLAUDE.md` - Detailed project documentation

## Common Pitfalls

1. **Do not use semicolons** - Prettier will remove them
2. **Use Svelte 5 runes** - Not legacy `let x = ...` reactive syntax
3. **Type all IPC data** - Add types to `src/preload/index.d.ts`
4. **Database migrations** - Add new migrations in `src/main/db/index.ts`
5. **No test files exist** - Run `pnpm typecheck` to verify changes
