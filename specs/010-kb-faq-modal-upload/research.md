# Research: 010-kb-faq-modal-upload

**Branch**: `010-kb-faq-modal-upload` | **Phase**: 0 — Outline & Research

---

## 1. Background Task Pattern (TaskIQ)

**Decision**: Registrar nova task `import_faq_file_task` em `backend/tasks.py`, seguindo o padrão exato de `process_video_task`.

**Rationale**: O sistema já usa TaskIQ + RabbitMQ para processamento assíncrono (constitution § IV). O padrão é:
1. Rota FastAPI cria um `BackgroundProcessLog` (status=`PENDENTE`), faz commit.
2. Invoca `task.kiq(log_id, payload)` — retorna `task_id`.
3. Salva `task_id` no log e retorna imediatamente ao frontend.
4. A task executa no worker, chama `_update_log_status()` em cada etapa.

**Alternativas consideradas**: Usar a rota `/knowledge-bases/{kb_id}/items/bulk` existente diretamente — rejeitado porque ela é síncrona e bloquearia a thread do servidor para arquivos grandes.

---

## 2. Endpoint de Upload de FAQ em Lote

**Decision**: Criar novo endpoint `POST /knowledge-bases/{kb_id}/faq-import` em `backend/main.py`.

**Rationale**: 
- O endpoint existente `POST /knowledge-bases/{kb_id}/upload` (linha 523 de `main.py`) faz processamento síncrono de arquivos. Não é adequado.
- O endpoint `/items/bulk` (linha 969) processa listas de KnowledgeItem em memória de forma síncrona.
- Um endpoint dedicado permite receber o arquivo (`UploadFile`), parsear no servidor, enfileirar via TaskIQ e retornar imediatamente o `log_id`.

**Schema de entrada** (`multipart/form-data`):
```
file: UploadFile (.txt | .json)
kb_id: int (path param)
```

**Schema de saída** (imediato):
```json
{
  "message": "Importação enfileirada",
  "log_id": 42,
  "faq_count": 12
}
```

---

## 3. Parser de Arquivo FAQ

**Decision**: Parser puro em Python, implementado em `backend/services/faq_import_service.py`.

### Parser TXT

Algoritmo:
1. Decodificar conteúdo como UTF-8 (fallback: Latin-1).
2. Dividir por separador `"----------------------------------------"` (48 hifens).
3. Para cada bloco, extrair:
   - `[classificação]` → linha que começa com `[` e termina com `]` → `metadata`
   - `Q: ...` → texto após `Q:` (strip) → `question`  
   - `A: ...` → texto após `A:` (strip) → `answer`
   - Ignorar linhas com `(Frequência:` ou qualquer padrão `(\w+: \d+)`.
4. Bloco válido = tem `question` **e** `answer` não-vazios.
5. Bloco inválido → logado em `logger.warning`, pulado.

### Parser JSON

1. Carregar array de objetos JSON.
2. Para cada objeto, mapear:
   - `question` → `question`
   - `answer` → `answer`
   - `metadata` → `metadata`
   - `category` → ignorado; usar `"FAQ"` fixo (FR-007).
3. Objeto inválido = faltando `question` ou `answer` → pulado.

**Alternativas consideradas**: Usar bibliotecas de terceiros como `pdfminer` ou `chardet` — rejeitado; UTF-8 é padrão definido (Assumption), e o escopo é apenas `.txt`/`.json` simples.

---

## 4. Detecção de Duplicatas (FR-014)

**Decision**: Verificar duplicata via query `SELECT id FROM knowledge_items WHERE knowledge_base_id = :kb_id AND question = :q AND answer = :a LIMIT 1` antes de cada insert.

**Rationale**: Simples, não requer índice especial. Para os volumes esperados (centenas de registros), a query é rápida. Não usaremos `INSERT OR IGNORE` (não suportado nativamente pelo PostgreSQL da forma esperada pelo ORM).

**Alternativas consideradas**: Unique constraint no banco em `(kb_id, question, answer)` — rejeitado porque quebraria registros existentes que possam ter duplicatas históricas.

---

## 5. Campo `metadata` no banco de dados

**Decision**: O campo `metadata_val` (coluna `Text` em `KnowledgeItemModel`) recebe o valor de `[classificação]` do TXT ou o campo `metadata` do JSON.

**Rationale**: O modelo já expõe `metadata_val` (mapeado como `metadata` na Pydantic schema `KnowledgeItem`). Não há mudança de schema necessária — nenhuma migração Alembic é exigida para esta feature.

---

## 6. Contagem de FAQs válidos para prévia (FR-017)

**Decision**: O parsing do arquivo acontece **no endpoint** (antes de enfileirar), extrai a lista de FAQs válidos, retorna `faq_count` no JSON de resposta imediata. O frontend exibe o count antes de o usuário clicar em "Confirmar".

**Rationale**: O arquivo é lido uma vez no endpoint para contar; a lista serializada é passada como payload da task (evita re-parsing no worker). Para arquivos grandes, o payload pode ser grande, mas é aceitável para "algumas centenas de registros" (Assumption).

**Alternativas consideradas**: Endpoint separado `/analyze` para preview (antes do upload real) — rejeitado por aumentar round-trips. O fluxo correto é: selecionar arquivo → frontend envia para `/faq-import` → backend parseia, retorna `faq_count` → frontend exibe preview → usuário confirma → tarefa já enfileirada. Alternativamente: parsing no frontend (JavaScript) para preview sem round-trip, e upload confirmado pelo usuário.

**Resolução**: Dado FR-017 (preview = só contagem) e SC-003 (< 3s para confirmação de enfileiramento), a abordagem mais simples é fazer **parsing no cliente (frontend)** para calcular o `faq_count` e exibir a prévia, e depois enviar o arquivo para o backend ao confirmar. O backend faz o re-parse no endpoint/task.

---

## 7. Alterações no Frontend (`KnowledgeBaseManager.jsx`)

**Componente alvo**: `frontend/src/components/KnowledgeBaseManager.jsx` (4148 linhas).

**Mudanças identificadas**:
1. **Linha 870**: Alterar label do botão de `"✨ Adicionar Novo"` → `"✨ Novo FAQ"`.
2. **Linha 4074**: Alterar título do modal de `"Novo Conhecimento"` → `"Adicionar FAQ Manualmente"`.
3. **Modal**: Adicionar estrutura de abas (`FAQ Manual` | `Documentos`) wrapeando o conteúdo existente (aba "FAQ Manual") e o novo componente de upload (aba "Documentos").

**Novo estado de aba**: `const [activeTab, setActiveTab] = useState('manual')` — `'manual'` ativa por padrão (FR-002/AC-3 da User Story 1).

**Novo sub-componente**: `FaqDocumentUploader` (embutido no modal ou extraído como componente separado).

---

## 8. Estrutura de arquivos impactados

```
backend/
├── main.py                         # + endpoint POST /knowledge-bases/{kb_id}/faq-import
├── tasks.py                        # + import_faq_file_task (@broker.task)
└── services/
    └── faq_import_service.py       # NOVO — parse TXT + JSON, lógica de dedup

frontend/src/components/
└── KnowledgeBaseManager.jsx        # Modificado — botão + modal com abas + FaqDocumentUploader
```

> Sem mudanças em `models.py` (schema compatível), sem migração Alembic.
