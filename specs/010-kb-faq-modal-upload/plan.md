# Implementation Plan: Atualizar Modal KB — Abas FAQ Manual e Upload de Documentos

**Branch**: `010-kb-faq-modal-upload` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/010-kb-faq-modal-upload/spec.md`

---

## Summary

Atualizar o modal da área `kb-quick-actions` em `KnowledgeBaseManager.jsx` para exibir duas abas — **"FAQ Manual"** (formulário existente renomeado) e **"Documentos"** (upload em lote via `.txt`/`.json`). O backend receberá os FAQs via endpoint dedicado `POST /knowledge-bases/{kb_id}/faq-import`, fará o parse do arquivo, enfileirará a persistência via TaskIQ (`import_faq_file_task`) e retornará confirmação imediata. O parse é implementado em um novo service isolado `faq_import_service.py`. Nenhuma mudança de schema de banco de dados é necessária.

---

## Technical Context

**Language/Version**: Python 3.11 (backend) · TypeScript/JSX (frontend — React)  
**Primary Dependencies**: FastAPI, TaskIQ + RabbitMQ, SQLAlchemy (async), Pydantic v2  
**Storage**: PostgreSQL + pgvector (tabela `knowledge_items` — sem mudanças)  
**Testing**: pytest (backend) · testes manuais / Vitest (frontend)  
**Target Platform**: On-premise Docker (Linux)  
**Project Type**: Web application (monorepo `backend/` + `frontend/`)  
**Performance Goals**: Confirmação de enfileiramento em < 3s (SC-003); processamento em background sem bloqueio  
**Constraints**: Processamento assíncrono obrigatório (TaskIQ); sem migração Alembic; sem bibliotecas externas novas  
**Scale/Scope**: Arquivos de até algumas centenas de FAQs; sem limite máximo definido em v1  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|---|---|---|
| **I. Canonical Tech Stack** | ✅ PASS | Backend Python/FastAPI; Frontend React; Background TaskIQ; DB PostgreSQL |
| **II. Service Layer Architecture** | ✅ PASS | Lógica de parse encapsulada em `faq_import_service.py` (backend/services/); rota delega ao service |
| **III. Data Integrity & Persistence** | ✅ PASS | Sem mudança de schema; soft delete e Unified ID já existentes; sem nova migração Alembic |
| **IV. Performance & Resilience** | ✅ PASS | Processamento pesado via TaskIQ (FR-009); sem blocking I/O na rota |
| **V. Security by Design** | ✅ PASS | Endpoint protegido por `verify_api_key` + `check_role([ADMIN, SUPERADMIN])` |
| **VI. Observability & Quality Gates** | ✅ PASS | `BackgroundProcessLog` usado para rastrear; erros logados via `logger.warning/error` |
| **VII. AI/LLM Integration** | ✅ N/A | Embedding gerado no worker (padrão existente via `get_embedding`) |
| **VIII. UX/UI Integrity** | ⚠️ PARTIAL | SC-003 garante confirmação < 3s. Progresso da task visível via `/background-tasks/ws` existente. Não é adicionado progress indicator específico para esta feature na v1 — aceitável pois o modal já fecha após confirmação |

**Violations**: Nenhuma. Constitution Check: **APROVADO**.

---

## Project Structure

### Documentation (this feature)

```text
specs/010-kb-faq-modal-upload/
├── plan.md              ← Este arquivo
├── spec.md              ← Especificação da feature
├── research.md          ← Phase 0: decisões e rationale
├── data-model.md        ← Phase 1: entidades e fluxo de dados
├── contracts/
│   └── api-contracts.md ← Phase 1: contratos de API e UI
└── tasks.md             ← Phase 2 (gerado por /speckit.tasks)
```

### Source Code (monorepo)

```text
backend/
├── main.py                          # + endpoint POST /knowledge-bases/{kb_id}/faq-import
├── tasks.py                         # + import_faq_file_task (@broker.task)
└── services/
    └── faq_import_service.py        # NOVO — parse TXT + JSON + lógica de dedup

frontend/src/components/
└── KnowledgeBaseManager.jsx         # Modificado:
                                     #   - Label botão → "✨ Novo FAQ" (linha 870)
                                     #   - Título modal → "Adicionar FAQ Manualmente" (linha 4074)
                                     #   - Modal com 2 abas + FaqDocumentUploader embutido
```

**Structure Decision**: Monorepo (Option 2) — já existente. Service layer para parse isolado em `backend/services/` conforme Constitution § II.

---

## Implementation Phases (resumo)

### Backend

1. **`backend/services/faq_import_service.py`** (novo)
   - `parse_txt(content: str) → list[ParsedFaqItem]`
   - `parse_json(content: str) → list[ParsedFaqItem]`
   - `parse_file(content: bytes, ext: str) → list[ParsedFaqItem]`

2. **`backend/tasks.py`** — adicionar task
   ```python
   @broker.task(task_name="import_faq_file_task")
   async def import_faq_file_task(log_id: int, kb_id: int, items: list[dict]) -> None:
       # Para cada item: check duplicata → INSERT + get_embedding() → update_log_status()
   ```

3. **`backend/main.py`** — adicionar endpoint
   ```python
   @app.post("/knowledge-bases/{kb_id}/faq-import", dependencies=[...])
   async def import_faq_file(kb_id: int, file: UploadFile, db: AsyncSession = ...):
       # parse_file() → cria log → .kiq() → retorna {log_id, faq_count}
   ```

### Frontend

4. **`KnowledgeBaseManager.jsx`** — 3 mudanças:
   - Linha 870: `"✨ Novo FAQ"`
   - Linha 4074: `"Adicionar FAQ Manualmente"`
   - Modal: adicionar estado `activeTab`, renderizar abas e componente `FaqDocumentUploader`

---

## Complexity Tracking

> Nenhuma violação da Constitution. Seção não aplicável.
