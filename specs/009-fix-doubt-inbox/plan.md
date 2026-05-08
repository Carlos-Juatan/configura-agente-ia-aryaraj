# Implementation Plan: Fix Doubt Inbox Functionality

**Branch**: `009-fix-doubt-inbox` | **Date**: 2026-05-08 | **Spec**: [spec.md](file:///mnt/D_DADOS/02_OPERACIONAL/TRABALHOS_ATIVOS/ALL_WORKS/Aryaraj/API%20-%20FluxAI/Projeto/configura-agente-ia-aryaraj/specs/009-fix-doubt-inbox/spec.md)
**Input**: Feature specification from `/specs/009-fix-doubt-inbox/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The objective is to fix and improve the "Inbox de Dúvidas" (Doubt Inbox) feature. Currently, the agent fails to automatically register questions it cannot answer. We will refactor the internal tool `registrar_duvida_sem_resposta`, refine the system prompt instructions to increase reliability (especially for Gemini models), and ensure robust database persistence with proper conversation context.

## Technical Context

**Language/Version**: Python 3.11  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, OpenAI SDK, pgvector  
**Storage**: PostgreSQL  
**Testing**: pytest  
**Target Platform**: Docker (Linux)
**Project Type**: Web Service (AI Agent Backend)  
**Performance Goals**: < 1s for registration overhead  
**Constraints**: Must maintain valid message sequences (Assistant-Tool-Assistant) for Gemini compatibility.  
**Scale/Scope**: All agents with `inbox_capture_enabled` active.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **I. Canonical Tech Stack**: Using FastAPI and async SQLAlchemy. (PASS)
2. **II. Service Layer Architecture**: Business logic for doubt registration will be encapsulated in the tool handler. (PASS)
3. **III. Data Integrity**: `UnansweredQuestionModel` correctly links to `agent_config`. (PASS)
4. **VII. AI Integration Discipline**: Ensuring proper fallback and tool calling protocols. (PASS)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── main.py              # API routes and dependency injection
├── agent.py             # Agent processing logic, tool injection, and tool handlers
├── models.py            # Database models (UnansweredQuestionModel)
└── services/
    └── agent_service.py # (Optional) Refactor logic here if too complex

tests/
├── contract/
├── integration/
└── unit/

```

**Structure Decision**: We will keep the logic primarily in `backend/agent.py` as it's the core of the message processing loop, but we will consolidate the tool handler and prompt injection logic to avoid duplication.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
