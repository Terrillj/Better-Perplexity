# Web

React + TypeScript frontend for Better-Perplexity with Vite, TanStack Query, and Tailwind CSS.

## Structure

```
src/
  app/              # Routes and main app
  components/       # Presentational components
  features/search/  # Search feature (types, API, hooks)
  lib/              # Utilities
  styles/           # Tailwind CSS
  test/             # Tests
```

## Development

```bash
# Install dependencies
pnpm install

# Run dev server (port 5173)
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test

# Lint
pnpm lint
```

## Features

- **SearchBox** - Query input with loading state
- **PlanChips** - Visual display of sub-queries
- **AnswerStream** - Answer with inline citations `[N]`
- **SourceCard** - Source display with signals and "why chosen" badges
- **MetricsBar** - Time and source count display

## What's Next

### High Priority

- [ ] **Implement shadcn/ui components**
  - Install shadcn/ui CLI
  - Add Button, Card, Input, Tabs components
  - Replace custom styled components

- [ ] **Wire actual answer synthesis** (`SearchPage.tsx`)
  - Remove setTimeout hack
  - Properly sequence search → plan → answer
  - Add proper error handling

- [ ] **Add citation click handlers** (`AnswerStream.tsx`)
  - Highlight corresponding source on citation click
  - Scroll to source card
  - Log CITATION_HOVERED events

- [ ] **Implement source expansion** (`SourceCard.tsx`)
  - Add expandable state to show full excerpt
  - Log SOURCE_EXPANDED events
  - Add passage highlighting

### Medium Priority

- [ ] **Add real-time answer streaming**
  - Stream answer text as it's generated
  - Update citations incrementally
  - Show progress indicator

- [ ] **Add personalization UI** (`SearchPage.tsx`)
  - Show "personalized for you" badge
  - Add settings panel to view preferences
  - Add "clear history" button

- [ ] **Improve responsive design**
  - Better mobile layout (stacked panels)
  - Touch-friendly interactions
  - Optimize for tablet

- [ ] **Add answer actions**
  - Save answer button (log ANSWER_SAVED)
  - Copy to clipboard
  - Share link

### Low Priority

- [ ] Add loading skeletons for better UX
- [ ] Add keyboard shortcuts
- [ ] Add dark mode toggle
- [ ] Add answer history/tabs
- [ ] Add export to PDF/Markdown

