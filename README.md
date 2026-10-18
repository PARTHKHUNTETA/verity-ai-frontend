# VerityAI — Frontend

> **VerityAI — Evaluated Research Agent** · _Research with evidence. Answers with confidence._

React + TypeScript web app for VerityAI. Design docs: [`../docs`](../docs).

## Getting started

The backend must be running (see [`../verity-ai-backend`](../verity-ai-backend)).

```bash
npm install
npm run dev               # http://localhost:5173 (proxies /api to http://localhost:4000)
```

## Scripts

| Script                                  | What it does                                                 |
| --------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                           | Vite dev server with hot reload                              |
| `npm run build` / `npm run preview`     | Typecheck + production build / serve the build               |
| `npm test`                              | Vitest + Testing Library (no backend needed)                 |
| `npm run typecheck` · `lint` · `format` | TypeScript · ESLint · Prettier (with Tailwind class sorting) |

## Structure

```
src/
├── main.tsx                # entry: StrictMode + <App />
├── app/                    # App (providers + router), routes.tsx, NotFoundPage
├── components/
│   ├── layout/             # AppShell, Sidebar, UserMenu, Logo, navigation config
│   └── ui/                 # Button, Input, Card, Alert, Spinner, EmptyState, PageHeader, icons
├── features/
│   ├── auth/               # AuthProvider, useAuth/useMe, route guards, login & register pages
│   ├── research/           # research form (+ discovery toggle), history, live run page (SSE),
│   │                       # citations, "Sources found" panel
│   ├── sources/            # collections, upload, document & chunk viewer, search tester
│   ├── reports/ evaluations/   # placeholders (filled in later)
│   └── organization/       # current organization + member list
├── services/
│   ├── api-client.ts       # fetch wrapper: access token, 401 → refresh → retry, ApiError
│   ├── auth-api.ts         # register, login, logout, me
│   ├── organization-api.ts
│   ├── research-api.ts     # tasks, runs, cancel, streamRun (typed SSE messages)
│   ├── sources-api.ts      # collections, uploads (FormData), sources, chunks, search
│   └── sse.ts              # minimal SSE parser for fetch() streams
├── types/api.ts            # response types mirroring the backend
└── test/                   # test setup + renderWithAuth helper
```

## How auth works in the browser

- The **access token** is kept in memory only (in `api-client.ts`), never in localStorage.
- The **refresh token** is an httpOnly cookie set by the backend; JavaScript can't read it.
- On page load, `AuthProvider` calls `/auth/refresh` to restore the session.
- When a request gets a 401, the client refreshes once and retries. Only one refresh runs at a
  time (shared promise in a tab, Web Locks across tabs), because the backend treats a reused
  refresh token as theft.
- `can(action)` from `useAuth()` hides UI the user can't use. The backend still checks every request.

## Live research runs

The run page (`features/research/RunPage.tsx`) follows a run over SSE with `useRunStream`. The pure
reducer in `run-stream-state.ts` applies `snapshot` / `status` / `delta` messages. Deltas carry an
`offset`, so duplicates are ignored and a gap triggers a reconnect, which starts with a fresh snapshot.

## Citations

Answers contain markers like `[2]`. `features/research/citations.ts` turns them into links
(`#cite-2`) that `AnswerView` renders as `CitationChip`s. Clicking one shows the exact passage,
with a link to `/sources/:id?chunk=:chunkId`, which scrolls to and highlights that chunk.

## Conventions

- Import from `src` with the `@/` alias.
- Server data goes through TanStack Query (`useQuery`); local UI state uses `useState`.
- Colors come from design tokens in `src/index.css` (`bg-brand-600`, `text-ink-muted`, …).
