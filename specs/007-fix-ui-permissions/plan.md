# Implementation Plan: 007-fix-ui-permissions

**Branch**: `007-fix-ui-permissions` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-fix-ui-permissions/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The feature aims to fix UI permissions and visibility regarding the chat history for Admin and User roles, restricting access to certain actions like "gerenciar conversas" and "gerar perguntas". It includes a visual fix for the Admin's "Chat" button width, adds sidebar access to "inbox de dúvidas" for the User role, and introduces a custom message formatting rule to bold text wrapped in a single asterisk (`*texto*`).

## Technical Context

**Language/Version**: TypeScript (Frontend React), Python (Backend FastAPI)
**Primary Dependencies**: React, Tailwind CSS, shadcn/ui, FastAPI
**Storage**: N/A
**Testing**: Jest/React Testing Library for UI, pytest for API validation
**Target Platform**: Web application
**Project Type**: Web service (frontend + backend)
**Performance Goals**: N/A
**Constraints**: Security role validation on backend for the "gerar perguntas" endpoint.
**Scale/Scope**: Frontend UI updates + Backend API validation + Markdown rendering.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Canonical Tech Stack**: The plan uses the required stack (React, Tailwind, FastAPI). No alternative tech introduced.
- **Security by Design**: Adheres to role-based access isolation. Adding backend API validation for "gerar perguntas" ensures the action is properly restricted.
- **UX/UI Integrity**: The visual fixes align with the project's goal of clean UX.

## Project Structure

### Documentation (this feature)

```text
specs/007-fix-ui-permissions/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   └── services/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: Web application (Option 2). The project is divided into a React `frontend/` and a FastAPI `backend/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
