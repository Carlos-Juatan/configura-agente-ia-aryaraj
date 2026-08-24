"""
task_logger_service.py — Generic logging utility for background tasks.

Persists structured log entries (timestamp + level + message) to the
``BackgroundProcessLog.execution_log`` JSON column in the database.

Key behaviours
--------------
- **Append-only**: Each call to ``append_log`` adds one entry.
- **Truncation policy**: When the log grows beyond 5,000 lines the service
  preserves the first 2,500 and last 2,497 entries, inserting a single
  WARNING sentinel line in between so viewers know content was omitted.
- **Thread-safe inside async tasks**: All DB operations use an
  ``async_session`` context manager and commit atomically.
"""

from __future__ import annotations

import logging
import traceback
from datetime import datetime, timezone
from typing import Literal

from database import async_session
from models import BackgroundProcessLog

logger = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────────────────
# Constants
# ────────────────────────────────────────────────────────────────────

MAX_LOG_LINES: int = 5_000
"""Maximum number of log entries stored per task."""

TRUNCATION_KEEP_HEAD: int = 2_500
"""Lines to keep at the top of the log when truncating."""

TRUNCATION_KEEP_TAIL: int = 2_497
"""Lines to keep at the bottom of the log when truncating."""

TRUNCATION_SENTINEL = {
    "timestamp": "",  # filled in at truncation time
    "level": "WARNING",
    "message": (
        "⚠️  [LOG TRUNCADO] O log excedeu 5.000 linhas. "
        "Parte intermediária do conteúdo foi omitida para preservar as primeiras e últimas entradas."
    ),
}

LogLevel = Literal["INFO", "WARNING", "ERROR"]


# ────────────────────────────────────────────────────────────────────
# Public API
# ────────────────────────────────────────────────────────────────────


async def append_log(
    log_id: int,
    message: str,
    level: LogLevel = "INFO",
) -> None:
    """Append a single log entry to the task's ``execution_log``.

    Parameters
    ----------
    log_id:
        Primary key of the ``BackgroundProcessLog`` row.
    message:
        Human-readable description of the current processing step.
    level:
        Severity level — ``"INFO"``, ``"WARNING"``, or ``"ERROR"``.
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": message,
    }

    async with async_session() as db:
        task_log = await db.get(BackgroundProcessLog, log_id)
        if task_log is None:
            logger.warning(
                "task_logger_service.append_log: log_id %d not found — skipping.", log_id
            )
            return

        current: list[dict] = list(task_log.execution_log or [])
        current.append(entry)

        # Apply truncation policy if needed
        if len(current) > MAX_LOG_LINES:
            sentinel = {**TRUNCATION_SENTINEL, "timestamp": entry["timestamp"]}
            current = (
                current[:TRUNCATION_KEEP_HEAD]
                + [sentinel]
                + current[-TRUNCATION_KEEP_TAIL:]
            )

        task_log.execution_log = current
        await db.commit()


async def append_error(
    log_id: int,
    message: str,
    exc: Exception | None = None,
) -> None:
    """Convenience wrapper that logs an ERROR with an optional stack trace.

    Parameters
    ----------
    log_id:
        Primary key of the ``BackgroundProcessLog`` row.
    message:
        High-level description of the error.
    exc:
        Optional exception instance; its traceback is appended to ``message``.
    """
    full_message = message
    if exc is not None:
        tb = traceback.format_exc()
        if tb and tb.strip() != "NoneType: None":
            full_message = f"{message}\n\n{tb}"

    await append_log(log_id, full_message, level="ERROR")


async def clear_log(log_id: int) -> None:
    """Reset the execution log for a task (used on reprocess)."""
    async with async_session() as db:
        task_log = await db.get(BackgroundProcessLog, log_id)
        if task_log is None:
            return
        task_log.execution_log = []
        await db.commit()


def build_initial_log_entry(task_type: str, language: str | None = None) -> dict:
    """Build the very first log entry for a newly queued task.

    Parameters
    ----------
    task_type:
        Human-readable task type label (e.g. ``"Transcrição de Vídeo"``).
    language:
        Optional language code selected by the user (e.g. ``"pt"``, ``"en"``).
    """
    lang_info = f" | Idioma: {language}" if language and language != "auto" else " | Idioma: Automático (detecção)"
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": "INFO",
        "message": f"🚀 Tarefa iniciada: {task_type}{lang_info}",
    }
