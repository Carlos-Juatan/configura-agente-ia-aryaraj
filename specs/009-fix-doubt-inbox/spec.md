# Feature Specification: Fix Doubt Inbox Functionality

**Feature Branch**: `009-fix-doubt-inbox`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: "corrigir a função de inbox de dúvidas, onde toda vez que o agente recebe uma pergunta onde ele não consegue responder essa dúvida fica registrada no inbox de dúvidas, e quero corrigir pois essa função não esta funcionando no momento"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Doubt Registration (Priority: P1)

As an AI Agent, when I receive a direct question that I cannot answer based on my system instructions or the provided knowledge base (RAG), I must automatically call the `registrar_duvida_sem_resposta` tool. This ensures the question is captured for the administrator to review and update the knowledge base.

**Why this priority**: This is the core functionality of the "Doubt Inbox". Without automatic registration, the administrator cannot identify gaps in the agent's knowledge.

**Independent Test**: 
1. Enable "Captura Automática" for an agent.
2. Ask a question that is explicitly not in the Knowledge Base (e.g., "Qual a cor favorita do dono da empresa?").
3. Verify if the tool `registrar_duvida_sem_resposta` was called in the "Raio-X" (debug).
4. Go to "Inbox de Dúvidas" and check if the question is listed there.

**Acceptance Scenarios**:

1. **Given** an agent with `inbox_capture_enabled=True`, **When** a user asks a question that yields no relevant RAG results, **Then** the agent MUST call `registrar_duvida_sem_resposta`.
2. **Given** the tool is called, **Then** a new record MUST appear in the `unanswered_questions` table with the correct `agent_id`, `session_id`, `question`, and `context`.

---

### User Story 2 - Reliable Registration Handler (Priority: P1)

The backend handler for the `registrar_duvida_sem_resposta` tool must reliably save the question to the database even in edge cases (e.g., missing session ID, empty question).

**Why this priority**: If the registration fails on the backend, the feature is useless regardless of the AI's intent.

**Independent Test**: Use the "Prompt Lab" or a test script to trigger the `registrar_duvida_sem_resposta` tool with various payloads and check for database entries.

**Acceptance Scenarios**:

1. **Given** a tool call to `registrar_duvida_sem_resposta`, **When** the database is accessible, **Then** the record MUST be saved successfully.
2. **Given** a tool call, **When** no `session_id` is present, **Then** the system MUST use a fallback value (e.g., "Desconhecida") and still save the record.

---

### User Story 3 - Transparent User Confirmation (Priority: P2)

When a doubt is registered, the agent should provide a clear and polite final response to the user, confirming that the question was noted and will be reviewed.

**Why this priority**: Improves user experience by acknowledging the limitation instead of simply saying "I don't know" or giving a generic error.

**Independent Test**: Interact with the agent, ask an unknown question, and verify that the final text response mentions the registration.

**Acceptance Scenarios**:

1. **Given** the tool returns a success message, **When** the agent generates the final response, **Then** it MUST incorporate the confirmation in its answer.

---

## Edge Cases

- **Hallucination**: What happens when the agent thinks it knows the answer but doesn't (hallucination)? In this case, it won't call the tool.
- **Ambiguous Questions**: How does the system handle "chatter" that looks like a question? The agent should be instructed to only register clear doubts about the business/domain.
- **Tool Duplication**: If a user manually adds a tool with the same name, the system must handle the conflict gracefully without breaking the internal capture logic.
- **Context Size**: If the conversation history is very long, the captured context might be truncated. The system should ensure the most relevant (last) turns are captured.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically inject the `registrar_duvida_sem_resposta` tool into the agent's tool list if `inbox_capture_enabled` is True.
- **FR-002**: System MUST inject a high-priority "Protocolo de Dúvidas" instruction into the system prompt when capture is enabled.
- **FR-003**: The backend tool handler MUST capture the current session context (last 5-10 messages) to provide meaning to the question in the Inbox.
- **FR-004**: The system MUST ensure compatibility with Gemini and OpenAI models by maintaining a valid message sequence (Assistant -> Tool -> Assistant).
- **FR-005**: The Inbox UI MUST correctly display questions captured by the automatic system, including the context provided.

### Key Entities *(include if feature involves data)*

- **UnansweredQuestion**: 
    - `id`: Unique identifier.
    - `agent_id`: The agent who failed to answer.
    - `session_id`: ID of the user session.
    - `question`: The specific question asked by the user.
    - `context`: Snapshot of the conversation history.
    - `status`: One of "PENDENTE", "RESPONDIDA", "DESCARTADA".
    - `created_at`: Timestamp of capture.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful `registrar_duvida_sem_resposta` tool calls result in a new database entry.
- **SC-002**: Questions appear in the "Inbox de Dúvidas" within 1 second of the tool call completion.
- **SC-003**: Context captured with the question contains at least the last 3 user messages (if available).

## Assumptions

- The administrator has enabled the "Inbox de Dúvidas" (Captura Automática) toggle in the agent configuration.
- The model used by the agent supports Function Calling / Tools.
- The PostgreSQL database is running and accessible by the backend.
- The `unanswered_questions` table schema is up to date with the required fields.
