# Implementation Plan: Criar Opção de Agente Roteador para Filtragem e Direcionamento de Mensagens

**Branch**: `012-add-router-agent` | **Date**: 2026-08-29 | **Spec**: [specs/012-add-router-agent/spec.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/spec.md)

---

## Summary

Implement a new **Router Agent** modality alongside the existing Standard Agent to support advanced lead message filtering and dynamic conversation routing. Users can select between creating a "Standard Agent" or a "Router Agent" in the UI. A Router Agent holds a custom filtering/classification prompt (`router_prompt`), links to multiple active destination agents, and maintains a fallback agent configuration (`fallback_agent_id`). When a lead sends a message, the router evaluates the message against the custom prompt rules, selects the appropriate destination agent (or fallback agent if unmatched/inactive), and forwards the full conversation history to the destination agent for handling.

---

## Technical Context

- **Language/Version**: Python 3.11+ (Backend), JavaScript / JSX (React 18 + Vite Frontend)
- **Primary Dependencies**: FastAPI, Pydantic v2+, SQLAlchemy ORM, AsyncOpenAI / httpx, Tailwind CSS / Lucide React
- **Storage**: PostgreSQL with pgvector, Alembic for schema migrations
- **Testing**: pytest (backend unit/integration tests), manual testing & cURL workflows
- **Target Platform**: Linux server (Docker / On-premise)
- **Project Type**: Web Application Monorepo (`backend/` + `frontend/`)
- **Performance Goals**: Routing evaluation overhead < 1.5s (SC-003), 95%+ routing accuracy on well-defined prompts (SC-002)
- **Constraints**: Service Layer Architecture (`backend/services/router_service.py`), Pydantic validation on all schemas, zero breaking changes to existing standard agent behavior, full conversation history transfer (FR-013).
- **Scale/Scope**: Support unlimited standard & router agents, dynamic routing across N destination agents.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Status | Details |
|---|---|---|
| **I. Canonical Tech Stack** | PASS | Python + FastAPI backend, React frontend, PostgreSQL + SQLAlchemy + Alembic, Pydantic v2 models, snake_case/camelCase conventions. |
| **II. Service Layer Architecture** | PASS | Routing & classifier logic isolated in `backend/services/router_service.py`. Route handlers delegate to services. |
| **III. Data Integrity & Persistence** | PASS | Database tables updated via Alembic migration (`agent_config` columns + `router_agent_destinations` table). Foreign keys use `CASCADE` / `SET NULL` appropriately. |
| **IV. Performance & Resilience** | PASS | Fallback mechanism (`fallback_agent_id`) handles unmatched messages, classification LLM errors, and inactive destination agents gracefully without crashing. |
| **V. Security by Design** | PASS | Role-based access enforcement (`ADMIN`, `SUPERADMIN` for creation/modification), secret management via `.env`. |
| **VI. Observability & Quality Gates** | PASS | `debug.routing` info added to interaction logs and execution responses. |
| **VII. AI/LLM Integration Discipline** | PASS | Low-cost classifier model (`gpt-4o-mini` / primary model) for message evaluation, fallback error pathing. |
| **VIII. UX/UI Integrity** | PASS | Visual badges ("Roteador" vs "Padrão") in agent lists, clear creation modal selector, destination mapping UI with validation. |

*Gate outcome: PASS (No violations).*

---

## Project Structure

### Documentation (this feature)

```text
specs/012-add-router-agent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 contracts
│   ├── agent-api-contract.md
│   └── router-execution-contract.md
└── tasks.md             # Phase 2 output (generated via /speckit-tasks)
```

### Source Code Layout

```text
backend/
├── alembic/versions/    # Schema migration for agent_type, router_prompt, fallback_agent_id, router_agent_destinations
├── models.py            # AgentConfigModel updates & RouterAgentDestinationModel table
├── config_store.py      # AgentConfig Pydantic model updates & RouterDestinationSchema
├── services/
│   └── router_service.py # Core router evaluation service logic
├── agent.py             # Integration with process_message & history passing
├── main.py              # API routes for CRUD & routing execution (/execute)
└── tests/
    └── test_router_agent.py # Test suite for Router Agent creation, validation & routing logic

frontend/src/
├── components/
│   ├── ConfigPanel.jsx  # Creation modal with agent type selector, Router Agent prompt & destinations UI, agent list badges
│   └── AgentHistory.jsx # Display routed interaction details
```

**Structure Decision**: Monorepo layout (`backend/` + `frontend/`) conforming to Constitution Principle I.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | N/A | Implementation fully aligns with Constitution and existing architecture patterns. |

---

## Artifact Links

- **Phase 0 Research**: [research.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/research.md)
- **Data Model**: [data-model.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/data-model.md)
- **API Contracts**:
  - [agent-api-contract.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/contracts/agent-api-contract.md)
  - [router-execution-contract.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/contracts/router-execution-contract.md)
- **Quickstart & Testing**: [quickstart.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/quickstart.md)
