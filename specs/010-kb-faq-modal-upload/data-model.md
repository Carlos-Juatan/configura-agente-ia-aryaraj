# Data Model: 010-kb-faq-modal-upload

**Branch**: `010-kb-faq-modal-upload` | **Phase**: 1 — Design

> ⚠️ Nenhuma mudança de schema de banco de dados é necessária. Todos os campos já existem em `KnowledgeItemModel`. Nenhuma migração Alembic é exigida.

---

## Entidades Existentes (sem alteração de schema)

### `KnowledgeItemModel` (`knowledge_items`)

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | `Integer` (PK) | No | ID único |
| `knowledge_base_id` | `Integer` (FK → `knowledge_bases.id`) | No | KB pai |
| `question` | `Text` | Yes | Conteúdo de `Q:` (TXT) ou campo `question` (JSON) |
| `answer` | `Text` | Yes | Conteúdo de `A:` (TXT) ou campo `answer` (JSON) |
| `metadata_val` | `Text` | Yes | Valor de `[classificação]` (TXT) ou campo `metadata` (JSON) |
| `category` | `String` | Yes | Fixo: `"FAQ"` para todos os itens importados via arquivo |
| `source_metadata` | `Text` | Yes | JSON livre; não usado nesta feature |
| `embedding` | `Vector(1536)` | Yes | Gerado via OpenAI no worker (assíncrono) |
| `parent_id` | `Integer` (FK self) | Yes | Não usado nesta feature |

**Regra de duplicata (FR-014)**: Antes de cada insert, verificar existência de `(knowledge_base_id, question, answer)`. Se existir, ignorar silenciosamente.

**Constraint de unicidade**: Não adicionada ao schema (para preservar dados históricos). A verificação é feita no nível de aplicação (service layer).

---

### `BackgroundProcessLog` (`background_process_logs`)

Entidade existente reutilizada para rastrear a tarefa de importação em lote.

| Coluna | Tipo | Descrição para este uso |
|---|---|---|
| `id` | `Integer` (PK) | `log_id` retornado ao frontend |
| `process_name` | `String` | `"Importação de FAQs"` |
| `status` | `String` | `PENDENTE` → `PROCESSANDO` → `CONCLUIDO` / `ERRO` |
| `progress` | `Integer` | % de itens processados (0–100) |
| `task_id` | `String` | TaskIQ task ID |
| `details` | `JSON` | `{"kb_id": int, "total": int, "imported": int, "skipped": int, "errors": int}` |
| `error_message` | `String` | Mensagem de erro geral (se task falhar completamente) |
| `created_at` | `DateTime` | Timestamp de criação |
| `updated_at` | `DateTime` | Timestamp da última atualização |

---

## Novo Serviço: `FaqImportService`

**Arquivo**: `backend/services/faq_import_service.py`

### Modelo interno: `ParsedFaqItem`

```python
@dataclass
class ParsedFaqItem:
    question: str   # extraído de Q: (TXT) ou campo question (JSON)
    answer: str     # extraído de A: (TXT) ou campo answer (JSON)
    metadata: str   # extraído de [classificação] (TXT) ou campo metadata (JSON)
    category: str = "FAQ"  # sempre fixo
```

### Métodos

| Método | Entrada | Saída | Observação |
|---|---|---|---|
| `parse_txt(content: str) → list[ParsedFaqItem]` | Conteúdo bruto `.txt` | Lista de itens válidos | Blocos separados por 48 hifens; blocos inválidos logados e pulados |
| `parse_json(content: str) → list[ParsedFaqItem]` | Conteúdo bruto `.json` | Lista de itens válidos | Objetos sem `question`/`answer` são pulados |
| `parse_file(content: bytes, ext: str) → list[ParsedFaqItem]` | Bytes + extensão | Lista de itens válidos | Dispatch: `.txt` → `parse_txt`, `.json` → `parse_json`; raise `ValueError` para ext não suportada |

### Regras de parse TXT (detalhe)

```
Separador: "----------------------------------------"  (48 hifens exatos)

Para cada bloco:
  - Linha que começa com "[" e termina com "]" → metadata (strip de "[" e "]")
  - Linha que começa com "Q:" → question = texto após "Q:" (strip)
  - Linha que começa com "A:" → answer = texto após "A:" (strip)
  - Linha que começa com "(" e contém "Frequência:" → IGNORAR (FR-008)
  
Bloco válido = question != "" AND answer != ""
Bloco inválido → logger.warning(f"Bloco inválido ignorado: {bloco[:50]}")
```

### Regras de parse JSON (detalhe)

```
Espera: array de objetos
Para cada objeto:
  - "question" (str, obrigatório)
  - "answer" (str, obrigatório)
  - "metadata" (str, opcional; default "")
  - "category" (ignorado; substituído por "FAQ")

Objeto inválido = ausência de "question" ou "answer", ou valores vazios
→ logger.warning(f"Objeto JSON inválido ignorado: índice {i}")
```

---

## Fluxo de Dados Completo

```
Frontend                    Backend (Endpoint)              Worker (TaskIQ)
   │                               │                               │
   │──── POST /faq-import ────────>│                               │
   │     (file: .txt/.json)        │ 1. parse_file() → items[]    │
   │                               │ 2. faq_count = len(items)    │
   │                               │ 3. Cria BackgroundProcessLog │
   │                               │    status=PENDENTE           │
   │                               │ 4. import_faq_file_task.kiq()│──>│
   │<── {log_id, faq_count} ───────│ 5. Retorna imediatamente     │   │
   │                               │                               │   │
   │                               │                      Para cada item:
   │                               │                      6. SELECT duplicata?
   │                               │                         → se existe: skip
   │                               │                         → se não: INSERT
   │                               │                             + get_embedding()
   │                               │                      7. _update_log_status()
   │                               │                         progress += step
   │                               │                      8. status=CONCLUIDO
```
