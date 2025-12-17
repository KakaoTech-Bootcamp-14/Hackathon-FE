# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZEUS AI is an AI-powered study planner application that creates optimal learning schedules from PDF documents. The application is built with Next.js 16, React 19, TypeScript, and uses shadcn/ui components with Tailwind CSS.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (default port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Architecture Overview

### Application Flow

The app follows a multi-view state machine pattern managed in `app/page.tsx`:

1. **Splash Screen** → displays for 2.5s on initial load
2. **Login/SignUp** → authentication views (currently mock, no backend)
3. **Home Calendar** → main dashboard with calendar and study plan management
4. **PDF Detail View** → detailed chapter/section view with integrated chatbot

State flows between views are controlled by `currentView` state in the root `Home` component.

### Core Data Model

The application revolves around three main types defined in `app/page.tsx`:

- **StudyPlan**: Top-level container for a PDF-based study schedule
  - Contains chapters, due date, daily hours, weekend settings
  - Tracks overall progress across all chapters

- **Chapter**: Represents a major section of study material
  - Contains multiple sections, scheduled date, completion status
  - Estimated time in minutes for completion

- **Section**: Smallest unit of study content
  - Contains actual content, key points, definitions
  - Individual completion tracking

### Component Architecture

**Main Views** (in `/components`):
- `splash-screen.tsx` - Animated loading screen
- `login-page.tsx` / `signup-page.tsx` - Authentication (mock)
- `home-calendar.tsx` - Calendar UI with drag-drop scheduling, sidebar with study plan list
- `pdf-detail-view.tsx` - Three-panel layout (TOC, content, chatbot)
- `pdf-upload-modal.tsx` - Multi-step wizard for PDF upload and plan creation

**Key Interactions**:
- Study plans are managed in the root `Home` component state
- Calendar view supports drag-and-drop chapter rescheduling
- PDF detail view has collapsible sidebar, section navigation, and integrated chatbot
- Chatbot (`chatbot.tsx`) provides context-aware assistance based on current chapter/section

### UI Components

This project uses shadcn/ui with the "new-york" style variant. Configuration is in `components.json`:
- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/ui`
- Tailwind CSS with CSS variables for theming
- Icon library: lucide-react
- Extensive component library in `components/ui/`

### State Management

No global state management library is used. State is lifted to appropriate parent components:
- Root state in `app/page.tsx`: study plans, current view, modal visibility
- Local state in views: calendar date, selected items, UI toggles

### Styling

- Tailwind CSS v4.1.9 with PostCSS
- Custom font: Pretendard (loaded from CDN in `app/layout.tsx`)
- Theme: Uses CSS variables for color scheme
- Responsive design with mobile considerations (hooks/use-mobile.ts)
- Animations via `tailwindcss-animate` and `tw-animate-css`

## Key Technical Notes

### Next.js Configuration

- TypeScript build errors are ignored (`ignoreBuildErrors: true`)
- Images are unoptimized (`images.unoptimized: true`)
- Uses Next.js App Router (app directory structure)
- All components use `"use client"` directive (fully client-side)

### Date Handling

- Uses native Date objects and `date-fns` library
- Dates are stored as ISO strings in state
- Calendar calculations in `home-calendar.tsx` use Date arithmetic

### Form Handling

- Uses `react-hook-form` with `@hookform/resolvers` for validation
- Zod for schema validation (installed but not heavily used in current code)

### PDF Processing

Currently **mock implementation only**:
- PDF upload is simulated (no actual parsing)
- Chapter/section data is hardcoded in `app/page.tsx`
- Upload modal (`pdf-upload-modal.tsx`) shows progress simulation
- Future integration point for real PDF parsing would be in the upload modal's `handleGenerate` function

### Chatbot

- Basic mock chatbot implementation in `components/chatbot.tsx`
- Pattern-based response generation (no AI backend)
- Context-aware of current chapter/section
- Integration point for real AI would be in `handleSend` function

## File Organization

```
app/
  layout.tsx          # Root layout, metadata, fonts
  page.tsx            # Main app logic, view routing, core types
  globals.css         # Global styles, CSS variables

components/
  *-page.tsx          # Full-page views (login, signup, splash)
  home-calendar.tsx   # Main calendar dashboard
  pdf-*.tsx           # PDF-related components (upload, detail view)
  chatbot.tsx         # AI assistant component
  ui/                 # shadcn/ui component library

lib/
  utils.ts            # Utility functions (cn() for class merging)

hooks/
  use-mobile.ts       # Mobile detection hook
  use-toast.ts        # Toast notification hook
```

## Development Patterns

### Component Props Pattern

Props are explicitly typed with interfaces:
```typescript
interface ComponentProps {
  data: Type
  onAction: (param: Type) => void
}
```

### State Update Pattern

Immutable updates using spread operators:
```typescript
const updatedPlans = studyPlans.map(plan =>
  plan.id === targetId ? { ...plan, ...updates } : plan
)
```

### Conditional Rendering

Uses ternary operators and conditional chaining extensively:
```typescript
{condition ? <Component /> : null}
{data?.optionalProperty}
```

## Important Context

- This is a hackathon project (path includes "AI:Hackathon")
- Korean language UI (`lang="ko"` in layout)
- Built with v0.app (noted in metadata generator field)
- Uses Vercel Analytics for tracking
- No backend currently - all data is client-side mock data
