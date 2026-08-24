"""
background_tasks.py — API routes for triggering and monitoring background tasks.

Uses TaskIQ's ``.kiq()`` API instead of the legacy Celery ``.delay()`` calls.
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import asyncio
from database import get_db, async_session
from models import BackgroundProcessLog
from tasks import process_video_task
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/background-tasks", tags=["Background Tasks"])


@router.post("/video")
async def start_video_processing(payload: dict, db: AsyncSession = Depends(get_db)):
    # 1. Cria log no DB
    log = BackgroundProcessLog(
        process_name="Processamento de Vídeo",
        status="PENDENTE",
        details=payload
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    # 2. Envia para o TaskIQ via .kiq()
    task_result = await process_video_task.kiq(log.id, payload)

    # Atualiza com o task_id real
    log.task_id = task_result.task_id
    await db.commit()

    return {
        "message": "Processamento iniciado",
        "log": {
            "id": log.id,
            "status": log.status,
            "process_name": log.process_name,
            "progress": log.progress
        }
    }


@router.get("/")
async def list_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BackgroundProcessLog).order_by(desc(BackgroundProcessLog.created_at)))
    return result.scalars().all()


@router.get("/{log_id}")
async def get_task_details(log_id: int, db: AsyncSession = Depends(get_db)):
    log = await db.get(BackgroundProcessLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Process Log not found")
    return log


@router.delete("/{log_id}")
async def delete_task_log(log_id: int, db: AsyncSession = Depends(get_db)):
    log = await db.get(BackgroundProcessLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Process Log not found")
    await db.delete(log)
    await db.commit()
    return {"success": True}


@router.post("/{log_id}/cancel")
async def cancel_task(log_id: int, db: AsyncSession = Depends(get_db)):
    """Cancel a running task by marking it as ERRO in the database."""
    log = await db.get(BackgroundProcessLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Process Log not found")

    if log.status in ["PENDENTE", "PROCESSANDO"]:
        log.status = "ERRO"
        log.error_message = "Cancelado pelo usuário"
        await db.commit()

    return {"success": True}


# ─── T009: Manual Reprocess Endpoint ─────────────────────────────────────────

@router.post("/{log_id}/reprocess")
async def reprocess_task(log_id: int, db: AsyncSession = Depends(get_db)):
    """Re-enqueue a failed task for a new processing cycle (FR-013).

    Resets retry_count, clears execution_log, resets status to PENDENTE,
    then re-dispatches the appropriate TaskIQ task from the stored payload.
    Only tasks with status ERRO are eligible.
    """
    log = await db.get(BackgroundProcessLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Process Log not found")

    if log.status != "ERRO":
        raise HTTPException(
            status_code=400,
            detail=f"Apenas tarefas com status ERRO podem ser reprocessadas. Status atual: {log.status}"
        )

    # Reset state for new processing cycle
    log.status = "PENDENTE"
    log.progress = 0
    log.retry_count = 0
    log.error_message = None
    log.execution_log = []
    await db.commit()

    # Re-dispatch the task using stored details
    details = log.details or {}
    kb_id = details.get("kb_id")
    payload = {
        "file_path": details.get("file_path", ""),
        "is_media": details.get("is_media", True),
        "options": details.get("options", {}),
        "metadata_val": details.get("metadata_val", ""),
        "original_filename": details.get("original_filename", ""),
        "language": log.language or "auto",
    }

    try:
        from tasks import process_kb_media_task
        task_result = await process_kb_media_task.kiq(log.id, kb_id, payload)
        log.task_id = task_result.task_id
        await db.commit()
    except Exception as e:
        logger.error("Erro ao re-enfileirar tarefa %d: %s", log_id, str(e))
        raise HTTPException(status_code=500, detail=f"Erro ao re-enfileirar: {str(e)}")

    return {
        "task_id": log.id,
        "status": "pending",
        "message": "Tarefa reenviada para fila de processamento."
    }


# ─── T006: WebSocket Real-time Task Log Streaming ────────────────────────────

@router.websocket("/ws/tasks/{log_id}/logs")
async def websocket_task_logs(websocket: WebSocket, log_id: int):
    """Stream new execution_log lines in real time via WebSocket (FR-005).

    Uses a cursor-based delta approach: only new lines since last push are sent.
    Closes automatically when task reaches CONCLUIDO or ERRO status.
    """
    await websocket.accept()
    cursor = 0  # next unsent entry index
    try:
        while True:
            async with async_session() as db:
                task_log = await db.get(BackgroundProcessLog, log_id)
                if task_log is None:
                    await websocket.send_json({"error": "Task not found", "done": True})
                    break

                current_log: list[dict] = task_log.execution_log or []
                new_entries = current_log[cursor:]
                cursor = len(current_log)

                payload = {
                    "task_id": log_id,
                    "status": task_log.status,
                    "retry_count": task_log.retry_count or 0,
                    "language": task_log.language,
                    "new_entries": new_entries,
                    "total_lines": len(current_log),
                    "done": task_log.status in ("CONCLUIDO", "ERRO"),
                }
                await websocket.send_json(payload)

                if payload["done"]:
                    break

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        logger.info("Client disconnected from /ws/tasks/%d/logs", log_id)
    except Exception as e:
        logger.error("WS error on /ws/tasks/%d/logs: %s", log_id, e)


# ─── Original polling WebSocket (backward compat) ────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            async with async_session() as db:
                from datetime import datetime, timedelta
                result = await db.execute(
                    select(BackgroundProcessLog)
                    .where(
                        (BackgroundProcessLog.status.in_(["PENDENTE", "PROCESSANDO"])) |
                        ((BackgroundProcessLog.status.in_(["CONCLUIDO", "ERRO"])) & (BackgroundProcessLog.updated_at > datetime.utcnow() - timedelta(minutes=5)))
                    )
                    .order_by(desc(BackgroundProcessLog.updated_at))
                )
                active_tasks = result.scalars().all()
                payload = [
                    {
                        "id": t.id,
                        "status": t.status,
                        "progress": t.progress,
                        "process_name": t.process_name,
                        "error_message": t.error_message,
                        "updated_at": t.updated_at.isoformat() if t.updated_at else None
                    } for t in active_tasks
                ]
                await websocket.send_json(payload)

            await asyncio.sleep(2)

    except WebSocketDisconnect:
        logger.info("Client disconnected from /ws")
    except Exception as e:
        logger.error(f"WS error: {e}")
