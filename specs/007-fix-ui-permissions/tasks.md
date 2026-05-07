---

description: "Task list for feature implementation"
---

# Tasks: 007-fix-ui-permissions

**Input**: Design documents from `/specs/007-fix-ui-permissions/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure and role-based access utilities per implementation plan in `frontend/src/` and `backend/src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Identify or create role checking utilities for components in `frontend/src/utils/auth.js`
- [x] T003 Identify or create dependency for role verification in `backend/src/api/dependencies.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Ajustes de Visibilidade na Tela de Chat (Priority: P1) 🎯 MVP

**Goal**: Mostrar apenas o conteúdo unificado do histórico e limitar ações baseadas no perfil.

**Independent Test**: Acessar o chat com ambos os perfis (admin/user), verificar abas ocultas e botões "gerenciar conversas", "gerar perguntas" e "excluir" corretos, e tentar a API direta.

### Implementation for User Story 1

- [x] T004 [P] [US1] Ocultar abas de filtro e exibir apenas "Tudo" no painel de histórico de conversas em `frontend/src/components/ChatPlayground.jsx`
- [x] T005 [P] [US1] Ocultar o botão "gerenciar conversas" para usuários comuns em `frontend/src/components/ChatPlayground.jsx`
- [x] T006 [P] [US1] Desabilitar o botão "gerenciar conversas" para Admin quando o histórico estiver vazio em `frontend/src/components/ChatPlayground.jsx`
- [x] T007 [P] [US1] Ocultar o botão "gerar perguntas" e mostrar apenas "excluir" ao selecionar conversas (Admin) em `frontend/src/components/ChatPlayground.jsx`
- [x] T008 [P] [US1] Adicionar bloqueio na API para retornar 403 caso Admin tente acessar a rota de gerar perguntas em `backend/src/api/routes/questions.py`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Correção Visual do Card do Agente para Admin (Priority: P2)

**Goal**: Garantir que o botão "Chat" no card do agente preencha o espaço horizontal para o admin.

**Independent Test**: Login como admin e verificar largura do botão "Chat" nos cards de agentes.

### Implementation for User Story 2

- [x] T009 [P] [US2] Adicionar estilo de largura total (w-full) ao botão "Chat" para o perfil Admin em `frontend/src/components/AgentCard.jsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Acesso ao Inbox de Dúvidas para Usuário Comum (Priority: P2)

**Goal**: Permitir acesso à tela de "inbox de dúvidas" através do menu lateral para usuários comuns.

**Independent Test**: Login como usuário comum, verificar menu lateral e clicar no link.

### Implementation for User Story 3

- [x] T010 [P] [US3] Adicionar item de navegação para "inbox de dúvidas" visível apenas para usuários comuns em `frontend/src/components/Sidebar.jsx`

**Checkpoint**: All user stories up to 3 should now be independently functional

---

## Phase 6: User Story 4 - Formatação de Mensagens com Negrito (Priority: P3)

**Goal**: Formatar textos delimitados por asterisco simples como negrito.

**Independent Test**: Enviar mensagem contendo `*texto*` e verificar se a renderização aplica a formatação em negrito.

### Implementation for User Story 4

- [x] T011 [P] [US4] Atualizar lógica de parsing de markdown para renderizar `*texto*` em negrito em `frontend/src/components/ChatMessage.jsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T004, T005, T006, T007 (Frontend UI updates) can be done in parallel with T008 (Backend API update) in US1.
- US2, US3, and US4 frontend component tasks can all be developed in parallel since they touch different files (`AgentCard.jsx`, `Sidebar.jsx`, `ChatMessage.jsx`).

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Setup & Foundational)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready
