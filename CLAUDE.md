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
2. **Login/SignUp** → authentication views
3. **Home Calendar** → main dashboard with calendar and study plan management
4. **PDF Detail View** → detailed chapter/section view with integrated chatbot
5. **Celebration/Incomplete** → outcome views based on completion status

State flows between views are controlled by `currentView` state in the root `Home` component. Session persistence uses `sessionStorage` with the key `"zeus-auth-session"`.

### Core Data Model

The application revolves around three main types defined in `app/page.tsx`:

- **StudyPlan**: Top-level container for a PDF-based study schedule
  - Contains chapters, due date, daily hours, weekend settings
  - Links to backend via `learningSourceId`
  - Tracks overall progress across all chapters

- **Chapter**: Represents a major section of study material
  - Contains multiple sections (tasks), scheduled date, completion status
  - Maps to backend `ChapterInfoDto` structure

- **Section**: Smallest unit of study content (called "Task" in backend)
  - Contains title, content, completion status
  - Corresponds to backend `TaskInfoDto`

### Backend API Integration

The app integrates with a REST API via `lib/api/` modules:

**API Client** (`lib/api/client.ts`):
- Base client using `fetch` with error handling
- Reads `NEXT_PUBLIC_API_BASE_URL` from environment variables
- Custom `ApiError` class for structured error responses
- `apiFetch<T>()` wrapper for type-safe API calls

**API Modules**:
- `auth.ts` - Login and signup endpoints
- `home.ts` - Fetches user's study plans and chapters from `/api/home/{userId}`
- `schedule.ts` - Creates/regenerates schedules with PDF upload (`/api/schedule`, `/api/schedule/reschedule`)
- `study.ts` - Task summary management and completion status updates

**Data Flow**:
1. Home view loads: `fetchHomeData()` → `mapHomeDataToStudyPlans()` converts DTOs to StudyPlan objects
2. PDF upload: `createSchedule()` sends multipart form data (PDF file + JSON request)
3. Task completion: `updateTaskCompletionStatus()` patches individual task status
4. Summary generation: `createTaskSummary()` and `fetchTaskSummary()` handle AI-generated study content

### Component Architecture

**Main Views** (in `/components`):
- `splash-screen.tsx` - Animated loading screen
- `login-page.tsx` / `signup-page.tsx` - Authentication forms
- `home-calendar.tsx` - Calendar UI with drag-drop scheduling, sidebar with study plan list
- `pdf-detail-view.tsx` - Three-panel layout (TOC, content, chatbot)
- `pdf-upload-modal.tsx` - Multi-step wizard for PDF upload and plan creation
- `celebration-page.tsx` / `incomplete-page.tsx` - Completion outcome views

**Key Interactions**:
- Study plans are fetched from backend on home view mount via `useEffect` hook in `app/page.tsx:131-149`
- Calendar view supports drag-and-drop chapter rescheduling
- PDF detail view has collapsible sidebar, section navigation, and integrated chatbot
- Progress calculation triggers view transitions to celebration/incomplete pages based on completion and due date

### UI Components

This project uses shadcn/ui with the "new-york" style variant. Configuration is in `components.json`:
- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/ui`
- Tailwind CSS with CSS variables for theming
- Icon library: lucide-react
- Extensive component library in `components/ui/`

### State Management

No global state management library is used. State is lifted to appropriate parent components:
- Root state in `app/page.tsx`: study plans (from API), current view, modal visibility, session status
- Local state in views: calendar date, selected items, UI toggles
- Backend serves as source of truth for study plans and task data

### Styling

- Tailwind CSS v4.1.9 with PostCSS
- Custom font: Pretendard (loaded from CDN in `app/layout.tsx`)
- Theme: Uses CSS variables for color scheme
- Responsive design with mobile considerations (`hooks/use-mobile.ts`)
- Animations via `tailwindcss-animate` and `tw-animate-css`

## Key Technical Notes

### Next.js Configuration

- TypeScript build errors are ignored (`ignoreBuildErrors: true` in `next.config.mjs`)
- Images are unoptimized (`images.unoptimized: true`)
- Uses Next.js App Router (app directory structure)
- All components use `"use client"` directive (fully client-side rendered)

### Environment Variables

Required environment variable:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API base URL (e.g., `http://localhost:8080`)

### Date Handling

- Uses native Date objects and `date-fns` library
- Dates are stored as ISO strings (YYYY-MM-DD format) in state and API
- Calendar calculations in `home-calendar.tsx` use Date arithmetic
- Backend DTOs use `studyDate` field in ISO format

### Form Handling

- Uses `react-hook-form` with `@hookform/resolvers` for validation
- Zod for schema validation (installed but not heavily used in current code)

### PDF Processing

**Current implementation**:
- PDF upload sends actual file to backend via `createSchedule()` in `lib/api/schedule.ts`
- Backend processes PDF and returns structured chapters/tasks
- Upload modal (`pdf-upload-modal.tsx`) handles multipart form submission
- Schedule regeneration available via `reCreateSchedule()` for existing learning sources

### API Error Handling

All API functions throw `ApiError` instances with:
- `status`: HTTP status code (0 for network errors)
- `message`: User-friendly error message (in Korean)
- `code`: Optional backend error code
- `details`: Raw error data from backend

Components should catch `ApiError` and display appropriate messages to users.

### Backend Data Mapping

The `mapHomeDataToStudyPlans()` function in `app/page.tsx:48-101` transforms backend DTOs:
- `LearningSourceResponseDto` → `StudyPlan`
- `ChapterInfoDto` → `Chapter`
- `TaskInfoDto` → `Section`
- Scheduled dates are derived from earliest task date in each chapter
- Due date is calculated from latest chapter date

## File Organization

```
app/
  layout.tsx          # Root layout, metadata, fonts
  page.tsx            # Main app logic, view routing, core types
  globals.css         # Global styles, CSS variables

components/
  *-page.tsx          # Full-page views (login, signup, splash, celebration, incomplete)
  home-calendar.tsx   # Main calendar dashboard
  pdf-*.tsx           # PDF-related components (upload, detail view)
  chatbot.tsx         # AI assistant component
  ui/                 # shadcn/ui component library

lib/
  utils.ts            # Utility functions (cn() for class merging)
  api/
    client.ts         # Base API client with error handling
    auth.ts           # Authentication endpoints
    home.ts           # Home data fetching
    schedule.ts       # Schedule creation/regeneration
    study.ts          # Task summary and completion APIs

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

### API Call Pattern

Use try-catch with ApiError handling:
```typescript
try {
  const response = await fetchHomeData()
  // handle success
} catch (error) {
  if (error instanceof ApiError) {
    // show user-friendly error message
    console.error(error.message)
  }
}
```

### Conditional Rendering

Uses ternary operators and conditional chaining extensively:
```typescript
{condition ? <Component /> : null}
{data?.optionalProperty}
```

## Important Context

- This is a hackathon project (path includes "AI-Hackathon")
- Korean language UI (`lang="ko"` in layout)
- Built with v0.app (noted in metadata generator field)
- Uses Vercel Analytics for tracking
- Backend API integration is active (no longer mock data)
- Session management uses sessionStorage (not persistent across browser restarts)
