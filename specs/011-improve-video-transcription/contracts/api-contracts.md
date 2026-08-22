# API Contracts: Video Transcription & Task Execution Logs

## Endpoints

### 1. Enqueue Video Import / Transcription
`POST /api/knowledge-bases/{kb_id}/video-import`

#### Request Body
```json
{
  "file_url": "https://s3.us-west-004.backblazeb2.com/vetmanager/kb/...",
  "language": "auto" // Options: "auto", "pt", "en", "es"
}
```

#### Response (202 Accepted)
```json
{
  "task_id": "938e1175-3b58-4f72-9d1e-91baa79b220a",
  "status": "pending",
  "message": "Processamento de vídeo iniciado em segundo plano."
}
```

---

### 2. Stream Task Execution Logs (Real-Time Push)
`GET /api/ws/tasks/{task_id}/logs` (WebSocket) or `GET /api/tasks/{task_id}/logs/stream` (SSE)

#### Payload Streamed (JSON)
```json
{
  "task_id": "938e1175-3b58-4f72-9d1e-91baa79b220a",
  "timestamp": "2026-08-22T13:25:01Z",
  "level": "INFO",
  "message": "Enviando arquivo para transcrição no AssemblyAI..."
}
```

---

### 3. Get Task Logs & Details (Persisted)
`GET /api/tasks/{task_id}`

#### Response (200 OK)
```json
{
  "id": "938e1175-3b58-4f72-9d1e-91baa79b220a",
  "task_type": "video_transcription",
  "status": "failed",
  "retry_count": 3,
  "language": "pt",
  "logs": [
    { "timestamp": "2026-08-22T13:25:00Z", "level": "INFO", "message": "Iniciando processamento..." },
    { "timestamp": "2026-08-22T13:25:05Z", "level": "ERROR", "message": "Erro na transcrição: ..." }
  ],
  "can_reprocess": true
}
```

---

### 4. Reprocess Failed Task
`POST /api/tasks/{task_id}/reprocess`

#### Response (200 OK)
```json
{
  "task_id": "938e1175-3b58-4f72-9d1e-91baa79b220a",
  "status": "pending",
  "message": "Tarefa reenviada para fila de processamento."
}
```
