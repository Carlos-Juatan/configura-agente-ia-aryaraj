# Phase 0 Research: Video Transcription Improvements & Background Task Logging

## Technical Research & Findings

### 1. AssemblyAI Deprecated `speech_model` Parameter

- **Problem**: `aai.TranscriptionConfig(speech_model="best", ...)` in `backend/transcription_service.py` causes API error because AssemblyAI deprecated `speech_model` in favor of `speech_model="nano"` or `speech_model="slam"` / `speech_models=["universal-3-5-pro", "universal-2"]`.
- **Decision**: Update `backend/transcription_service.py` to use valid parameters (`speech_model="nano"` or `speech_models=["universal-3-5-pro", "universal-2"]` depending on assemblyai SDK version or removing explicit deprecated string `"best"` in favor of modern SDK defaults or supported enum / model names). Also pass language configuration parameter properly (`language_code` or `language_detection`).
- **Language Code Support**:
  - `pt` (Português)
  - `en` (Inglês)
  - `es` (Espanhol)
  - `autoLanguage: True` -> `language_detection=True` when "Automático" is selected.

### 2. Task IQ & Background Process Logging Architecture

- **Problem**: Background tasks currently run via TaskIQ (`backend/tasks.py` / `backend/broker.py`), but task logs/progress are either unpersisted or minimally tracked.
- **Decision**:
  - Enhance DB models (or Task model) to store `execution_log` (text/json array of timestamped log entries).
  - Implement log truncation logic at 5,000 lines (preserve first N and last N lines with a notice line in between).
  - Implement task retry logic (up to 3 automatic retries with progressive delay for video transcription).
  - Expose SSE / WebSocket endpoint (`/api/ws/tasks/{task_id}/logs` or SSE endpoint) to stream log lines real-time as tasks progress.
  - Add `reprocess` endpoint for failed tasks.

### 3. Frontend Component & API Integration

- **Decision**:
  - Update Video Upload Modal / Knowledge Base file upload component to include Language selector dropdown: Automático (default), Português (Brasil), Inglês, Espanhol.
  - Pass selected `language` in API payload to `/knowledge-bases/{kb_id}/video-import` or task enqueue endpoint.
  - Enhance task details modal to display terminal-style log output with real-time updates via WebSocket/SSE and a "Reprocessar" button for failed tasks.
