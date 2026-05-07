# Implementation Plan: Enhanced User Roles, Permissions and Navigation Refactor

**Branch**: `006-user-roles-inbox-refactor` | **Date**: 2026-05-07 | **Spec**: [spec.md](file:///mnt/D_DADOS/02_OPERACIONAL/TRABALHOS_ATIVOS/ALL_WORKS/Aryaraj/API - FluxAI/Projeto/o.c.a.ia-aryaraj-alternativ-branch/specs/006-user-roles-inbox-refactor/spec.md)

## Summary

This feature refactors the FluxAI role-based access control (RBAC) system to support a four-tier hierarchy: `SUPERADMIN`, `ADMIN` (Team), `USUARIO_ADMIN`, and `USUARIO` (Client). It includes significant UI/UX changes: moving the "Inbox de Dúvidas" to the sidebar, implementing invitation-only registration with 24h expiry, and strictly limiting UI element visibility based on roles. A unified promotion/demotion modal will be created for user management.

## Technical Context

**Language/Version**: Python 3.11+ (FastAPI), JavaScript (React 18+, Vite)  
**Primary Dependencies**: FastAPI, SQLAlchemy, Alembic, TaskIQ, RabbitMQ, React, Vanilla CSS  
**Storage**: PostgreSQL + pgvector  
**Testing**: pytest (backend), Vitest/Playwright (frontend)  
**Target Platform**: On-premise Docker deployment  
**Project Type**: Web Service / Web Application  
**Performance Goals**: Instant UI feedback, <200ms API response time for navigation  
**Constraints**: Single-tenant, strict RBAC enforcement at both API and UI levels  
**Scale/Scope**: ~10k users per instance, ~50 UI screens/components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Role-Based Access**: The plan implements rigid isolation between Superadmin, Admin, and Client roles.
- [x] **UX/UI Integrity**: Moving the Inbox to the sidebar improves system visibility and accessibility.
- [x] **Secret management**: All role configuration and initial superadmin credentials are in `.env`.
- [x] **Security by Design**: Authentication uses JWT, and the new invitation system prevents manual user injection.

## Project Structure

### Documentation (this feature)

```text
specs/006-user-roles-inbox-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── main.py              # API routes and role guards
├── models.py            # User and Invitation models
├── services/            # Auth and logic for invitations
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx             # Updated with Inbox link
│   │   ├── UserManagement.jsx      # Updated with unified modal
│   │   ├── UnansweredQuestions.jsx # Moved logic
│   │   ├── ChatPlayground.jsx      # Restricted UI (Tests/Prompt)
│   │   ├── KnowledgeBaseManager.jsx# Restricted UI (Settings/Tabs)
│   │   └── ConfigPanel.jsx         # Hidden for clients
│   ├── pages/
│   │   └── Register.jsx            # Updated for invitations
│   └── services/                   # Auth and role helpers
└── tests/
```

**Structure Decision**: Web application structure with distinct `backend` and `frontend` projects.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Multi-tier role logic in UI | Required for premium client experience and security. | Simple "if-admin" checks are insufficient for the four-role hierarchy. |

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**:
   - Research existing Invitation Link logic in `backend/main.py` and `models.py`.
   - Verify current implementation of "Inbox de Dúvidas" in `UnansweredQuestions.jsx` and its API endpoints.
   - Investigate how `ChatPlayground.jsx` and `KnowledgeBaseManager.jsx` currently render conditional buttons.

2. **Generate and dispatch research agents**:
   - Task: "Research `InvitationModel` usage and token validation logic for 24h expiry in `backend`."
   - Task: "Identify all occurrences of 'Edit Prompt' and 'Database Settings' buttons in `frontend` for role-based hiding."
   - Task: "Check `Sidebar.jsx` and `Dashboard.jsx` for existing tab/menu conditional rendering patterns."

3. **Consolidate findings** in `research.md`.

## Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - `UserRole` enum update (if needed).
   - `InvitationModel` attributes (token, expires_at, role).
   - `AuditLogModel` for promotion actions.

2. **Define interface contracts** → `/contracts/`:
   - `POST /invitations/generate`: Generate 24h link.
   - `GET /invitations/validate/{token}`: Check if link is valid.
   - `POST /users/manage/role`: Unified endpoint for promotion/demotion.

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh agy`.
