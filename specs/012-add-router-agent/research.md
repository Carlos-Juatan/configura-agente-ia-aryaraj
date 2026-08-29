# Phase 0 Research: Agente Roteador para Filtragem e Direcionamento de Mensagens

**Feature Branch**: `012-add-router-agent`  
**Date**: 2026-08-29  
**Spec**: [specs/012-add-router-agent/spec.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/spec.md)

---

## Technical Context & Decisions

### 1. Database Schema & Entity Design for Router Agents
- **Decision**: Extend `AgentConfigModel` with `agent_type` (`"standard"` | `"router"`), `router_prompt` (Text, custom prompt for lead message classification/routing), and `fallback_agent_id` (Integer, ForeignKey to `agent_config.id` with `ondelete="SET NULL"`). Create a dedicated many-to-many relationship table `router_agent_destinations` linking a Router Agent (`router_agent_id`) to multiple Destination Agents (`destination_agent_id`) with additional metadata like `routing_instruction` and `priority`.
- **Rationale**: Storing destination links in a dedicated association model with SQLAlchemy relations allows clear relational integrity, CASCADE deletion handling, clean query loading via `selectinload`, and flexible UI management.
- **Alternatives Considered**: 
  - *Storing destination IDs in a JSON array string*: Rejected because it breaks relational integrity, makes foreign key enforcement impossible when destination agents are deleted, and prevents clean ORM queries.

### 2. Message Classification & Routing Engine
- **Decision**: Implement a dedicated `router_service.py` in `backend/services/router_service.py` following Constitution Principle II (Service Layer Architecture). The service exposes `evaluate_router_agent(router_agent, message, history, destination_agents, db_session)` which uses a lightweight, low-latency LLM call (e.g. `gpt-4o-mini` or primary agent model with JSON output mode) to evaluate the lead message against the Router Agent's custom prompt and registered destination agent descriptions/instructions.
- **Output Schema**: The classifier LLM returns a structured JSON:
  ```json
  {
    "selected_agent_id": 15,
    "confidence": 0.95,
    "reasoning": "Message requested appointment scheduling.",
    "is_fallback": false
  }
  ```
- **Rationale**: Offloading routing logic to a service layer keeps `agent.py` and `main.py` clean, modular, and unit-testable.

### 3. Fallback Mechanics & Edge Case Resilience
- **Decision**: 
  1. **Unmatched / Low-Confidence Classification**: If the router LLM fails to match a specific rule or explicitly signals an unknown intent, the service routes the execution to `fallback_agent_id`.
  2. **Inactive Destination Agent**: If the router selects a destination agent that has `is_active == False` or has been deleted, the system automatically redirects the message to `fallback_agent_id`.
  3. **Classification LLM Timeout/Error**: If the classification call fails or times out, the system logs the incident and immediately delegates execution to `fallback_agent_id`.
  4. **Unconfigured Fallback**: If no fallback agent is explicitly defined, the router agent defaults to the first active destination agent or returns a graceful configuration error notice.
- **Rationale**: Meets FR-009, FR-010, and FR-012, fulfilling Constitution Principle IV (Degradation Path & Resilience).

### 4. Conversation History Transfer
- **Decision**: When delegating execution from the Router Agent to the selected Destination Agent, the system passes the entire session history array (`history`), appending a internal metadata context line to inform the destination agent about the routing event:
  ```json
  {
    "role": "system",
    "content": "[ROUTER DELEGATION] Conversa direcionada pelo Agente Roteador 'Roteador Principal' para 'Agente de Vendas'. Motivo: Cliente solicitou informações comerciais."
  }
  ```
- **Rationale**: Meets FR-013 and User Scenario Clarification (Session 2026-08-29) requiring complete history transfer so destination agents have full context.

### 5. Validation Rules & Constraints
- **Decision**: 
  - A Router Agent CANNOT be marked as active (`is_active = True`) or saved if it has 0 associated destination agents (FR-008).
  - Validation requires a non-empty `router_prompt` for Router Agents.
  - A Router Agent cannot set itself as its own destination agent or fallback agent (anti-loop validation).
- **Rationale**: Prevents broken routing setups in production.

### 6. Frontend UI / UX Enhancements
- **Decision**:
  - Update `AgentConfigModel` Pydantic schema and React components in `ConfigPanel.jsx`.
  - Creation Modal: Display a step/selector choice between "Agente Padrão" (Standard Agent) and "Agente Roteador" (Router Agent).
  - List View: Add visual badge/tag (`"Roteador"` in purple/indigo badge vs `"Padrão"` in neutral badge) to clearly distinguish agent types (FR-006).
  - Config Panel: For Router Agents, expose tab/section for configuring `router_prompt`, selecting fallback agent from dropdown, and managing destination agents (multi-select / item list with custom instructions).
- **Rationale**: Meets FR-001, FR-004, FR-005, FR-006, and Constitution Principle VIII (UX/UI Integrity).

---

## Summary of Findings

All technical requirements, validation rules, edge cases, and constitution constraints are fully mapped. Phase 1 artifacts (Data Model, API Contracts, Quickstart Guide, Implementation Plan) can be constructed cleanly on top of these design choices.
