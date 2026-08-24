"""Add execution_log, retry_count, language, deleted_at to background_process_logs

Revision ID: d7e8f9a0b1c2
Revises: ccf39c73e9d2
Create Date: 2026-08-22 13:40:00.000000

Feature: 011-improve-video-transcription
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e8f9a0b1c2'
down_revision: Union[str, Sequence[str], None] = 'ccf39c73e9d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns to background_process_logs for Feature 011."""
    # execution_log: JSON list of {timestamp, level, message} entries
    op.execute(
        "ALTER TABLE background_process_logs "
        "ADD COLUMN IF NOT EXISTS execution_log JSONB DEFAULT '[]'::jsonb"
    )
    # retry_count: number of automatic retry attempts performed
    op.execute(
        "ALTER TABLE background_process_logs "
        "ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0"
    )
    # language: language selected for video transcription ("auto", "pt", "en", "es")
    op.execute(
        "ALTER TABLE background_process_logs "
        "ADD COLUMN IF NOT EXISTS language VARCHAR"
    )
    # deleted_at: soft-delete timestamp (NULL = not deleted)
    op.execute(
        "ALTER TABLE background_process_logs "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP"
    )


def downgrade() -> None:
    """Revert Feature 011 columns from background_process_logs."""
    op.execute(
        "ALTER TABLE background_process_logs DROP COLUMN IF EXISTS execution_log"
    )
    op.execute(
        "ALTER TABLE background_process_logs DROP COLUMN IF EXISTS retry_count"
    )
    op.execute(
        "ALTER TABLE background_process_logs DROP COLUMN IF EXISTS language"
    )
    op.execute(
        "ALTER TABLE background_process_logs DROP COLUMN IF EXISTS deleted_at"
    )
