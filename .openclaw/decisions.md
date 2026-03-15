# Agent Manager - Decisions Log

## Project Scope
**Goal:** GUI tool to config OpenClaw agents, replacing manual file editing.

**Target Users:**
- TrustAI team (Marcus, Nova, Alex)
- OpenClaw community developers

**Pain Point:** OpenClaw agent setup requires editing multiple MD files manually → error-prone, no validation.

## MVP Scope (M1 Only)
**Decision:** Start with M1, validate before building M2/M3.

**M1 Features:**
- Form editor for SOUL.md, IDENTITY.md, AGENTS.md
- Backend: Parse/generate MD files
- Frontend: Form validation + preview
- Export: Download .zip workspace bundle
- Storage: LocalStorage (local-first, no cloud)

**Deferred to Phase 2:**
- M2: Flow visualization (agent routing graph)
- M3: Import validation + advanced export

## Tech Stack
- Frontend: React + TailwindCSS + shadcn/ui
- Backend: Express (ports: BE=3015, FE=5187)
- No secrets in export (user adds manually)

## Constraints
- Max 10 agents (MVP)
- Empty config → warning, no export
- Circular dependencies → detect + alert

## Rationale
- M1 solves core pain (GUI > manual editing)
- Fast validation with real users
- If M1 useful → proceed to M2/M3
