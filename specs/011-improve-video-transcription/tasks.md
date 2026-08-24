# Tasks: Melhorias na Transcrição de Vídeo e Logs de Processamento em Background

**Input**: Design documents from `/specs/011-improve-video-transcription/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verification of current environment and preparation of feature structure.

- [x] T001 Verify AssemblyAI SDK dependencies in `backend/requirements.txt` and `.env` configuration
- [x] T002 [P] Verify TaskIQ and WebSocket routing infrastructure in `backend/main.py` and `backend/broker.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and generic background task logging framework required across all stories.

- [x] T003 Update DB models in `backend/models.py` to support `execution_log` storage, task status, retry counts, language selection, and `deleted_at` for soft delete
- [x] T004 Run database migrations via Alembic for task model schema updates in `backend/alembic/`
- [x] T005 Implement generic logger utility with 5,000-line truncation policy in `backend/services/task_logger_service.py` (must capture current stage and full error stack trace for ERROR levels)
- [x] T006 [P] Implement WebSocket/SSE log streaming endpoint in `backend/main.py` for real-time task progress pushing
- [x] T006b [P] Create scheduled TaskIQ job in `backend/background_tasks.py` to clean up logs/tasks older than 30 days

**Checkpoint**: Core logging & task data layer ready - user story implementations can begin.

---

## Phase 3: User Story 1 - Correção e Robusteza do Processamento de Vídeo (Priority: P1) 🎯 MVP

**Goal**: Corrigir erro de `speech_model` descontinuado no AssemblyAI, implementar retry automático (3 tentativas) e permitir reprocessamento manual de vídeos em falha.

**Independent Test**: Enviar um vídeo para transcrição no banco de conhecimento, confirmar processamento com modelo atualizado e testar o botão "Reprocessar" em caso de falha.

### Implementation for User Story 1

- [x] T007 [US1] Update `transcribe_video` in `backend/transcription_service.py` to remove deprecated `speech_model="best"` and use valid parameters (`speech_models=["universal-3-5-pro", "universal-2"]` or default)
- [x] T008 [US1] Update TaskIQ background task in `backend/tasks.py` to include retry mechanism (up to 3 automatic attempts with progressive delay: 30s, 90s, 180s)
- [x] T009 [US1] Add `POST /api/tasks/{task_id}/reprocess` endpoint in `backend/main.py` to allow manual reprocessing of failed tasks
- [x] T010 [US1] Update backend route for video import in `backend/main.py` to handle task status and retry state properly

**Checkpoint**: At this point, video transcription works without `speech_model` errors and supports retries and manual reprocessing.

---

## Phase 4: User Story 2 - Log Detalhado de Todos os Processamentos em Background (Priority: P2)

**Goal**: Exibir log detalhado estilo terminal no frontend para todas as tarefas em background (vídeo, documentos, FAQs) com suporte a tempo real.

**Independent Test**: Abrir modal "Ver Detalhes" de qualquer tarefa em andamento ou concluída no frontend e verificar se o log linha a linha (com timestamps) é exibido e atualizado em tempo real.

### Implementation for User Story 2

- [x] T011 [P] [US2] Create reusable Terminal Log Viewer component in `frontend/src/components/TaskDetailsModal.tsx` (include handling for empty logs state with informational message)
- [x] T012 [US2] Integrate WebSocket/SSE connection in `frontend/src/components/TaskDetailsModal.tsx` to receive real-time log updates
- [x] T013 [US2] Add "Reprocessar" button to `frontend/src/components/TaskDetailsModal.tsx` for tasks with `failed` status
- [x] T014 [US2] Integrate `TaskDetailsModal` into `KnowledgeBaseManager` in `frontend/src/components/KnowledgeBase/` for video, document, and FAQ tasks
- [x] T014b [US2] Integrate frontend "Reprocessar" button with backend `POST /api/tasks/{task_id}/reprocess` endpoint to validate end-to-end restart flow

**Checkpoint**: Detailed terminal-style log modal is fully functional across all background task types in the UI.

---

## Phase 5: User Story 3 - Seleção de Linguagem para Transcrição de Vídeo (Priority: P3)

**Goal**: Adicionar seletor de idioma (Automático, Português, Inglês, Espanhol) no formulário de adição de vídeo e repassar o parâmetro para o backend/AssemblyAI.

**Independent Test**: Selecionar um idioma específico na adição do vídeo e verificar se a solicitação envia a linguagem escolhida e se o log registra a opção selecionada.

### Implementation for User Story 3

- [x] T015 [P] [US3] Add language selection dropdown (Automático, Português, Inglês, Espanhol) to video upload modal in `frontend/src/components/KnowledgeBase/`
- [x] T016 [US3] Update frontend API call in `frontend/src/services/` to pass selected language parameter on video import
- [x] T017 [US3] Update backend video import route in `backend/main.py` and `backend/transcription_service.py` to apply selected language in AssemblyAI `TranscriptionConfig`
- [x] T018 [US3] Add language info to initial log entry in `backend/services/task_logger_service.py`

**Checkpoint**: Language selection is fully integrated end-to-end from UI to AssemblyAI transcription.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, edge case verification, and final smoke testing.

- [x] T019 [P] Verify 5,000-line log truncation behavior with warning line in `backend/services/task_logger_service.py`
- [x] T020 Run end-to-end quickstart testing flow from `specs/011-improve-video-transcription/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS User Stories 1, 2, and 3.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2 (and UI integration points from US1).
- **User Story 3 (Phase 5)**: Depends on Phase 2 & Phase 3 (extends transcription config).
- **Polish (Phase 6)**: Depends on completion of User Stories 1-3.

### Parallel Opportunities

- T002, T006, T011, T015 can be developed in parallel as they target separate frontend/backend files without direct code conflicts.
