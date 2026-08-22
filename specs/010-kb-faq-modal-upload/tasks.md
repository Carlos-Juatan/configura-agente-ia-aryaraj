# Tasks: Atualizar Modal KB — Abas FAQ Manual e Upload de Documentos

**Input**: Design documents from `/specs/010-kb-faq-modal-upload/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparação inicial e verificação de ambiente

- [x] T001 Verificar ambiente e arquivos de suporte para o parser de FAQs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de backend (serviço de importação e background task) necessária para dar suporte às histórias de usuário

**⚠️ CRITICAL**: Nenhuma história de usuário que dependa de upload/processamento pode ser finalizada sem esta fase pronta.

- [x] T002 Criar serviço de parsing `backend/services/faq_import_service.py` com suporte a `.txt` (48 hifens, [classificação], Q:, A:) e `.json` (array de objetos)
- [x] T003 [P] Registrar a task assíncrona `import_faq_file_task` em `backend/tasks.py` utilizando o TaskIQ e manipulando duplicatas e falhas parciais (FR-014, FR-015)
- [x] T004 Adicionar endpoint `POST /knowledge-bases/{kb_id}/faq-import` em `backend/main.py` integrando com `faq_import_service.py` e disparando a task via `kiq()`

**Checkpoint**: Backend pronto para receber uploads e processar arquivos de FAQ em lote.

---

## Phase 3: User Story 1 — Renomear botão e abrir modal com abas (Priority: P1) 🎯 MVP

**Goal**: Renomear o botão de ação principal para "✨ Novo FAQ" e reestruturar o modal com as abas "FAQ Manual" e "Documentos".

**Independent Test**: Navegar até a página de banco de dados, verificar o rótulo do botão "✨ Novo FAQ", clicar nele e confirmar que o modal abre com a aba "FAQ Manual" ativa por padrão e a aba "Documentos" disponível.

### Implementation for User Story 1

- [x] T005 [US1] Atualizar rótulo do botão de ação de "✨ Adicionar Novo" para "✨ Novo FAQ" em `frontend/src/components/KnowledgeBaseManager.jsx`
- [x] T006 [US1] Adicionar estado de controle de abas (`activeTab`) e renderizar a barra de navegação com as abas "FAQ Manual" e "Documentos" no modal em `frontend/src/components/KnowledgeBaseManager.jsx`

**Checkpoint**: O botão exibe o novo texto e o modal abre com as abas estruturadas, mantendo "FAQ Manual" ativa.

---

## Phase 4: User Story 2 — Adicionar FAQ individualmente via aba "FAQ Manual" (Priority: P2)

**Goal**: Garantir a funcionalidade de adição individual de FAQ sob a nova aba "FAQ Manual" e com o título renomeado.

**Independent Test**: Abrir o modal na aba "FAQ Manual", verificar o título "Adicionar FAQ Manualmente", preencher pergunta, resposta e categoria, e salvar para confirmar que a criação individual continua funcionando sem regressão.

### Implementation for User Story 2

- [x] T007 [US2] Renomear o título do formulário manual de "Novo Conhecimento" para "Adicionar FAQ Manualmente" dentro da aba "FAQ Manual" em `frontend/src/components/KnowledgeBaseManager.jsx`
- [x] T008 [US2] Garantir que o envio e as validações do formulário manual funcionem sem regressão em `frontend/src/components/KnowledgeBaseManager.jsx`

**Checkpoint**: Adição manual funcionando 100% sem regressão no novo layout do modal.

---

## Phase 5: User Story 3 — Importar FAQs em lote via arquivo na aba "Documentos" (Priority: P1)

**Goal**: Permitir a seleção, prévia (contagem apenas), envio e processamento em segundo plano de arquivos `.txt` e `.json` na aba "Documentos".

**Independent Test**: Acessar a aba "Documentos", selecionar um arquivo `.txt` ou `.json` válido, verificar a prévia indicando a quantidade de FAQs (ex: "X FAQs encontrados"), confirmar o upload e verificar a mensagem de confirmação imediata.

### Implementation for User Story 3

- [x] T009 [US3] Implementar o componente de upload/drag-and-drop e a validação do tipo de arquivo (.txt e .json) na aba "Documentos" em `frontend/src/components/KnowledgeBaseManager.jsx`
- [x] T010 [US3] Implementar a exibição da prévia indicando exclusivamente a contagem de FAQs válidos no arquivo (FR-017) em `frontend/src/components/KnowledgeBaseManager.jsx`
- [x] T011 [US3] Integrar a confirmação de envio com a API `POST /knowledge-bases/{kb_id}/faq-import`, lidando com confirmação imediata (< 3s) e exibição de feedback ao usuário em `frontend/src/components/KnowledgeBaseManager.jsx`
- [x] T012 [US3] Garantir que fechar o modal durante o enfileiramento não cancele a operação em background (FR-016) em `frontend/src/components/KnowledgeBaseManager.jsx`

**Checkpoint**: Importação em lote funcional via frontend e integrada ao backend/background task.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finais de estilização, alinhamento visual e testes manuais operacionais.

- [x] T013 [P] Ajustar o estilo visual das abas do modal para manter a identidade glassmorphism/dark mode do projeto em `frontend/src/components/KnowledgeBaseManager.jsx`
- [x] T014 Validar o fluxo ponta a ponta com arquivos `.txt` e `.json` de exemplo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências.
- **Foundational (Phase 2)**: Depende do Setup. Bloqueia a conclusão da User Story 3.
- **User Story 1 (Phase 3)**: Depende do Setup. Pode ser feito em paralelo ou antes da Phase 2.
- **User Story 2 (Phase 4)**: Depende da User Story 1 (layout com abas).
- **User Story 3 (Phase 5)**: Depende da User Story 1 (layout com abas) e da Phase 2 (backend endpoints & tasks).
- **Polish (Phase 6)**: Depende das User Stories 1, 2 e 3.

### Parallel Opportunities

- T003 e T002 podem ser desenvolvidos em paralelo no backend.
- T005, T006 e T007 podem ser feitos juntos durante a refatoração da UI do modal.
- T013 pode ser feito em paralelo durante os testes visuais.

---

## Implementation Strategy

### MVP Scope (User Story 1 + Foundational + User Story 3)

1. Implementar o serviço de importação backend (`faq_import_service.py`), task e endpoint (T002, T003, T004).
2. Atualizar o botão para "✨ Novo FAQ" e criar as abas no modal (T005, T006).
3. Ajustar o formulário manual existente (T007, T008).
4. Adicionar a funcionalidade de upload e integração de lote na aba "Documentos" (T009, T010, T011, T012).
5. Polish visual e teste final (T013, T014).
