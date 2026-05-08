# Data Model: Doubt Inbox

## Existing Entities

### UnansweredQuestion (`unanswered_questions`)
Captures questions the agent could not answer.

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL (PK) | Unique identifier |
| `agent_id` | INTEGER (FK) | Reference to `agent_config.id` |
| `session_id` | VARCHAR | ID of the user session (or thread_id) |
| `question` | TEXT | The exact question asked by the user |
| `context` | TEXT | Snapshot of recent messages for context |
| `status` | VARCHAR | "PENDENTE" (default), "RESPONDIDA", "DESCARTADA" |
| `created_at`| TIMESTAMP | When the question was captured |
| `updated_at`| TIMESTAMP | Last modification time |

## Relationships
- **Agent** (1:N) **UnansweredQuestion**: One agent can have many unanswered questions.
- **Session** (1:N) **UnansweredQuestion**: One session can have multiple unanswered questions if the agent fails multiple times.

## Tool Contract: `registrar_duvida_sem_resposta`

**Description**: Registers a question in the Doubt Inbox when the information is missing from the Knowledge Base.

**Parameters**:
- `pergunta` (string, required): The user's question to be registered.

**Output**:
- Success message: "Desculpe, eu ainda não tenho essa informação... acabei de registrar sua dúvida..."
- Error message: "Erro ao registrar dúvida: [details]"
