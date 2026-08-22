# Quickstart Guide: Testing Video Transcription & Background Task Logging

## 1. Prerequisites
- Valid `ASSEMBLYAI_API_KEY` configured in `.env`.
- TaskIQ / RabbitMQ background worker running (`backend/tasks.py` / TaskIQ worker).
- FastAPI backend server running.

## 2. Test Video Transcription with Selected Language
1. Access the Knowledge Base UI in the frontend.
2. Select a Knowledge Base and click **Adicionar Vídeo**.
3. Choose a video file or provide a video URL, select **Linguagem** (e.g. `Português (Brasil)` or `Automático`).
4. Submit the modal.

## 3. Test Terminal-Style Execution Logs & Real-Time Stream
1. Click **Ver Detalhes** on the background task card.
2. Verify that line-by-line log output is rendered with timestamps in a terminal view.
3. Observe real-time log additions as processing progresses.

## 4. Test Auto-Retry & Reprocess Flow
1. In case of an unexpected external error, verify task retries automatically up to 3 times before setting status to `failed`.
2. On `failed` status, verify the **Reprocessar** button appears in the modal details.
3. Click **Reprocessar** and verify new execution cycle begins with new log entries.
