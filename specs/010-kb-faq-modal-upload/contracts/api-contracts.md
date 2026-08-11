# API Contracts: 010-kb-faq-modal-upload

**Branch**: `010-kb-faq-modal-upload` | **Phase**: 1 — Design

---

## Novo Endpoint

### `POST /knowledge-bases/{kb_id}/faq-import`

**Descrição**: Recebe um arquivo `.txt` ou `.json` com FAQs no formato padronizado, parseia no servidor, enfileira o processamento via TaskIQ e retorna imediatamente a confirmação.

**Auth**: `verify_api_key` + `check_role([SUPERADMIN, ADMIN])`

**Content-Type**: `multipart/form-data`

#### Request

| Parâmetro | Local | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `kb_id` | Path | `int` | Sim | ID da Knowledge Base destino |
| `file` | Form (file) | `UploadFile` | Sim | Arquivo `.txt` ou `.json` com FAQs |

#### Response `200 OK` (enfileirado com sucesso)

```json
{
  "message": "Importação enfileirada",
  "log_id": 42,
  "faq_count": 12
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `message` | `string` | Mensagem de confirmação |
| `log_id` | `int` | ID do `BackgroundProcessLog` para rastreamento |
| `faq_count` | `int` | Número de FAQs válidos identificados no arquivo |

#### Response `400 Bad Request` — Arquivo inválido

```json
{
  "detail": "Formato de arquivo não suportado. Use .txt ou .json."
}
```

#### Response `400 Bad Request` — Nenhum FAQ válido encontrado

```json
{
  "detail": "Nenhum FAQ válido encontrado no arquivo."
}
```

#### Response `404 Not Found` — KB não existe

```json
{
  "detail": "Knowledge base not found"
}
```

---

## Contratos de Formato de Arquivo

### Formato TXT

```
[Classificação Temática]
Q: Texto da pergunta completo
A: Texto da resposta completo
(Frequência: 42)

----------------------------------------
[Outra Classificação]
Q: Outra pergunta
A: Outra resposta
```

| Elemento | Regra |
|---|---|
| `[...]` | Primeira linha do bloco; valor entre colchetes → `metadata_val` |
| `Q:` | Prefixo da pergunta; texto após `Q:` (strip) → `question` |
| `A:` | Prefixo da resposta; texto após `A:` (strip) → `answer` |
| `(Frequência: N)` | Ignorado completamente (FR-008) |
| Separador | 48 hifens exatos: `----------------------------------------` |
| Encoding | UTF-8 (padrão); Latin-1 como fallback |

### Formato JSON

```json
[
  {
    "question": "Texto da pergunta",
    "answer": "Texto da resposta",
    "metadata": "Classificação Temática",
    "category": "FAQ"
  }
]
```

| Campo | Tipo | Obrigatório | Comportamento |
|---|---|---|---|
| `question` | `string` | Sim | → `question` no banco |
| `answer` | `string` | Sim | → `answer` no banco |
| `metadata` | `string` | Não | → `metadata_val` no banco (default `""`) |
| `category` | `string` | Não | **Ignorado**; substituído por `"FAQ"` fixo |

---

## Contratos de UI (Frontend)

### Estados do componente `FaqDocumentUploader`

| Estado | Descrição | UI |
|---|---|---|
| `idle` | Nenhum arquivo selecionado | Drag-and-drop zone + botão "Selecionar arquivo" |
| `parsing` | Parsing local do arquivo | Loading indicator |
| `preview` | FAQs contados e válidos | Badge: "X FAQs encontrados" + botão "Confirmar importação" |
| `uploading` | POST em andamento | Spinner; botões desabilitados |
| `success` | Enfileiramento confirmado | Mensagem de sucesso: "X FAQs enfileirados para importação" + `log_id` |
| `error` | Arquivo inválido ou erro de rede | Mensagem de erro descritiva |

### Validações no frontend (antes do upload)

| Regra | Mensagem |
|---|---|
| Extensão ≠ `.txt` / `.json` | `"Formato não suportado. Use .txt ou .json."` |
| Nenhum FAQ válido após parse local | `"Nenhum FAQ válido encontrado no arquivo."` |
| Arquivo vazio | `"O arquivo está vazio."` |

### Transições de tab no modal

```
Modal aberto
    └── Tab "FAQ Manual" (ativa por padrão)
        └── Formulário existente (sem alterações funcionais)
    └── Tab "Documentos"
        └── FaqDocumentUploader
```

**Estado da tab**: `useState('manual')` — não persistido entre aberturas do modal.
