# Tasks: Criar Opção de Agente Roteador para Filtragem e Direcionamento de Mensagens

**Input**: Design documents from `/specs/012-add-router-agent/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User Story identifier (`[US1]`, `[US2]`, `[US3]`)
- File paths are explicitly specified for every task.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project readiness and environment setup for feature branch `012-add-router-agent`.

- [ ] T001 Verify branch status and dependencies for feature 012 in `backend/` and `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema, model definitions, and router service infrastructure that MUST be completed before user stories can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Create Alembic database migration script for `AgentConfigModel` column updates (`agent_type`, `router_prompt`, `fallback_agent_id`) and `router_agent_destinations` table in `backend/alembic/versions/`
- [ ] T003 [P] Update ORM models to add `agent_type`, `router_prompt`, `fallback_agent_id`, and `RouterAgentDestinationModel` association entity in `backend/models.py`
- [ ] T004 [P] Update Pydantic schemas `AgentConfig` and `RouterDestinationSchema` to support router fields in `backend/config_store.py`
- [ ] T005 Implement core routing classifier service `evaluate_router_agent` in `backend/services/router_service.py`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Seleção do Tipo de Agente e Criação de Agente Roteador (Priority: P1) 🎯 MVP

**Goal**: Allow gestors to choose between creating a "Agente Padrão" and a "Agente Roteador" during agent creation and visually distinguish agent types in listings.

**Independent Test**: Access agent creation modal in frontend UI, select "Agente Roteador", enter name and router prompt, save, and confirm that the agent is created with type "router" and displays a "Roteador" badge in the agent list.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Write unit tests for agent creation with `agent_type` validation in `backend/tests/test_router_agent.py`
- [ ] T007 [US1] Update API endpoints `POST /agents` and `GET /agents` to persist and return `agent_type` and `router_prompt` in `backend/main.py`
- [ ] T008 [P] [US1] Add agent type selection radio/cards ("Agente Padrão" vs "Agente Roteador") to agent creation modal in `frontend/src/components/ConfigPanel.jsx`
- [ ] T009 [P] [US1] Add visual agent type badges ("Roteador" vs "Padrão") to agent list cards in `frontend/src/components/ConfigPanel.jsx`

**Checkpoint**: User Story 1 complete and testable independently (MVP ready).

---

## Phase 4: User Story 2 - Associar Agentes de Destino e Regras de Filtragem por Prompt (Priority: P2)

**Goal**: Allow associating multiple destination agents and a fallback agent to a Router Agent, configuring prompt filtering rules, and enforcing zero-destination validation.

**Independent Test**: Open configuration for a Router Agent, attach 2+ destination agents, select a Fallback Agent, enter routing rules, save changes, and verify that attempting to activate/save a Router Agent without destinations raises a validation error.

### Implementation for User Story 2

- [ ] T010 [P] [US2] Write contract tests for router destination mapping and zero-destination validation in `backend/tests/test_router_agent.py`
- [ ] T011 [US2] Update `PUT /agents/{agent_id}` and `POST /agents/{agent_id}/toggle` in `backend/main.py` with destination synchronization and active validation
- [ ] T012 [P] [US2] Add destination agent selector, fallback agent dropdown, and custom router prompt editor in `frontend/src/components/ConfigPanel.jsx`
- [ ] T013 [US2] Add frontend form validation preventing activation of a Router Agent without at least 1 destination agent in `frontend/src/components/ConfigPanel.jsx`

**Checkpoint**: User Stories 1 AND 2 complete and functional independently.

---

## Phase 5: User Story 3 - Processamento e Roteamento Dinâmico de Mensagens do Lead (Priority: P3)

**Goal**: Process incoming lead messages through the Router Agent, evaluate intent using LLM classification, route execution to the target destination agent (or fallback), and pass full conversation history.

**Independent Test**: Send messages with different intents to `/execute` specifying a Router Agent ID. Verify that messages are routed to the correct destination agents, conversation history is completely forwarded, and `debug.routing` metadata is returned.

### Implementation for User Story 3

- [ ] T014 [P] [US3] Write integration tests for message classification, fallback routing, and history transfer in `backend/tests/test_router_agent.py`
- [ ] T015 [US3] Integrate `evaluate_router_agent` into `/execute` endpoint processing flow in `backend/main.py` and `backend/agent.py`
- [ ] T016 [US3] Implement full history transfer with system routing delegation marker (`[ROUTER DELEGATION]`) in `backend/agent.py`
- [ ] T017 [US3] Implement fallback routing for unclassified intents, inactive destination agents, or classification LLM errors in `backend/services/router_service.py`
- [ ] T018 [P] [US3] Add `debug.routing` metadata display in Raio-X modal and execution debug drawer in `frontend/src/components/AgentHistory.jsx`

**Checkpoint**: All User Stories complete and independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates, full test suite execution, and end-to-end verification.

- [ ] T019 [P] Update execution examples and cURL test commands in `specs/012-add-router-agent/quickstart.md`
- [ ] T020 Run full test suite `pytest tests/test_router_agent.py` and perform manual quickstart verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all User Stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
  - US1 (P1) → US2 (P2) → US3 (P3) (sequential or parallel if staffed).
- **Polish (Phase 6)**: Depends on all User Stories completion.

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational phase.
- **US2 (P2)**: Independent UI/Backend configuration building on US1 agent types.
- **US3 (P3)**: Execution engine utilizing US1 agent types and US2 destination mappings.

---

## Parallel Opportunities

- **Phase 2 (Foundational)**: T003 (`models.py`) and T004 (`config_store.py`) can run in parallel.
- **Phase 3 (US1)**: T006 (`tests`), T008 (`ConfigPanel.jsx` modal), and T009 (`ConfigPanel.jsx` badges) can run in parallel.
- **Phase 4 (US2)**: T010 (`tests`) and T012 (`ConfigPanel.jsx` UI fields) can run in parallel.
- **Phase 5 (US3)**: T014 (`tests`) and T018 (`AgentHistory.jsx` debug display) can run in parallel.

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)
1. Complete Phase 1 & Phase 2 (Foundational DB schema & ORM models).
2. Complete Phase 3 (US1 agent type selection & visual listing badges).
3. Validate agent creation independently.

### Full Delivery
1. Deliver MVP (US1).
2. Add US2 (Destination agent mapping & zero-destination validation).
3. Add US3 (Dynamic routing engine, fallback path, and history forwarding).
4. Run final test suite and quickstart verification.
