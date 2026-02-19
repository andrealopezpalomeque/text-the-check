# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Text the Check — WhatsApp-first financial companion for Argentina/Latin America. Two modes: **Grupos** (split group expenses, track debts) and **Finanzas** (personal bills, recurring payments, spending insights). Spanish-language (`es_AR`), dark mode by default.

## Repository Structure

- **`client/`** — Main unified Nuxt 3 frontend (landing + both app modes). **Active codebase.**
- **`viaje-grupo/`** — Original grupos system (npm workspaces: `client/` + `server/`). Frontend being merged into `client/`; the Express.js server (WhatsApp bot + Gemini AI) remains here.
- **`pay-trackr/`** — Legacy/archived.

## Architecture

**Frontend** — Nuxt 3 SPA (`ssr: false`), Tailwind CSS (CSS variable theming), Pinia stores, Firebase client SDK (Firestore real-time + Google OAuth). Auto-imports configured for `stores/`, `stores/grupos/`, `stores/finanzas/`, `composables/`, `composables/finanzas/`. Components use `pathPrefix: false` (no directory prefix).

**Auth** — Firebase plugin (`plugins/firebase.client.ts`) → auth init plugin (`plugins/auth-init.client.ts`) → `useAuth` composable (Google sign-in, links to Firestore `ttc_user`) → `middleware/auth.ts` guards routes. Public routes: `/`, `/login`, `/setup`, `/join`.

**Stores** — Grupos: `useGroupStore`, `useExpenseStore`, `usePaymentStore`, `useUserStore`. Finanzas: `usePaymentStore`, `useRecurrentStore`, `useCategoryStore`, `useTemplateStore`, `useWeeklySummaryStore`. All use Firestore `onSnapshot()` for real-time sync.

**Firestore collections** — Grupos: `ttc_user`, `ttc_group`, `ttc_expense`, `ttc_payment`. Finanzas: `ttc_finanzas_payment`, `ttc_finanzas_recurring`, `ttc_finanzas_category`, `ttc_finanzas_template`.

**Backend** (`viaje-grupo/server/`) — Express.js + TypeScript, WhatsApp Business API webhook, Gemini 2.0 Flash for NL expense parsing, Fuse.js for fuzzy @mention matching, Firebase Admin SDK.

## Key Conventions

- Firebase config via `runtimeConfig.public` env vars (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, etc.)
- App mode (`grupos`/`finanzas`) in `useAppMode`, theme in `useTheme` — both persisted to localStorage
- Fonts: Outfit (wordmark), Nunito (headings), DM Sans (body), Poppins + Inter (app UI)
- dayjs with Spanish locale for dates
- Brand: "text the check" always lowercase, "the" accented in brand blue

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Keep the main context window clean - offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
