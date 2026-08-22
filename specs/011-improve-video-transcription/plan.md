# Implementation Plan: Melhorias na Transcrição de Vídeo no Banco de Conhecimento

**Branch**: `011-improve-video-transcription` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-improve-video-transcription/spec.md`

## Summary

Corrigir a chamada de transcrição no AssemblyAI removendo o parâmetro descontinuado (`speech_model="best"`), implementar seleção de idioma no formulário de adição de vídeo, e construir um subsistema genérico de logs detalhados para tarefas em background (estilo terminal, persistido, com SSE/WebSocket para tempo real e botão de reprocessamento manual).

## Technical Context

**Language/Version**: Python 3.11 (Backend), TypeScript / React (Frontend)  
**Primary Dependencies**: FastAPI, TaskIQ + RabbitMQ, AssemblyAI SDK, Tailwind CSS, React  
**Storage**: PostgreSQL + SQLAlchemy (armazenamento relacional de tarefas/logs)  
**Testing**: pytest  
**Target Platform**: Web application (monorepo: `backend/` + `frontend/`)  
**Project Type**: Monorepo Web Service / Application  
**Performance Goals**: Log streaming com latência <100ms via SSE/WebSocket, suporte a até 5.000 linhas de log por tarefa  
**Constraints**: Não bloquear I/O no servidor (TaskIQ para background tasks), truncamento inteligente com aviso acima de 5.000 linhas  
**Scale/Scope**: Todas as tarefas em background (vídeo, documentos, FAQs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I (Canonical Tech Stack)**: FastAPI no backend, React+TypeScript no frontend, TaskIQ + RabbitMQ para tarefas em background. Passa ✅.
- **Princípio II (Service Layer Architecture)**: Lógica de negócio isolada em `transcription_service.py` e rotas finas em FastAPI. Passa ✅.
- **Princípio IV (Performance & Resilience)**: Nenhuma I/O bloqueante. Processamento em TaskIQ com mecanismo de retry automático (3 tentativas). Passa ✅.
- **Princípio VIII (UX/UI Integrity & Background Monitoring)**: Progresso em tempo real e log técnico no modal de detalhes estilo terminal. Passa ✅.

## Project Structure

### Documentation (this feature)

```text
specs/011-improve-video-transcription/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── main.py
├── models.py
├── tasks.py
├── transcription_service.py
└── services/

frontend/
└── src/
    ├── components/
    │   ├── KnowledgeBase/
    │   └── TaskDetailsModal.tsx
    └── services/
```

**Structure Decision**: Monorepo Web Application layout (`backend/` e `frontend/`).

## Complexity Tracking

> Nenhuma violação da Constituição. Todos os princípios e guardrails arquiteturais foram respeitados.
