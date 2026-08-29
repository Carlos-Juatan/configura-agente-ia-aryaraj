"""Add agent_type, router_prompt, fallback_agent_id to agent_config and create router_agent_destinations table

Revision ID: e1f2a3b4c5d6
Revises: d7e8f9a0b1c2
Create Date: 2026-08-29 09:00:00.000000

Feature: 012-add-router-agent
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd7e8f9a0b1c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add router agent fields to agent_config and create router_agent_destinations table."""

    # 1. Add agent_type column to agent_config (default 'standard' for existing rows)
    op.execute(
        "ALTER TABLE agent_config "
        "ADD COLUMN IF NOT EXISTS agent_type VARCHAR(32) NOT NULL DEFAULT 'standard'"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_agent_config_agent_type ON agent_config (agent_type)"
    )

    # 2. Add router_prompt column to agent_config (nullable text)
    op.execute(
        "ALTER TABLE agent_config "
        "ADD COLUMN IF NOT EXISTS router_prompt TEXT"
    )

    # 3. Add fallback_agent_id FK column (nullable, self-referencing, SET NULL on delete)
    op.execute(
        "ALTER TABLE agent_config "
        "ADD COLUMN IF NOT EXISTS fallback_agent_id INTEGER "
        "REFERENCES agent_config(id) ON DELETE SET NULL"
    )

    # 4. Create the router_agent_destinations association table
    op.execute("""
        CREATE TABLE IF NOT EXISTS router_agent_destinations (
            id SERIAL PRIMARY KEY,
            router_agent_id INTEGER NOT NULL REFERENCES agent_config(id) ON DELETE CASCADE,
            destination_agent_id INTEGER NOT NULL REFERENCES agent_config(id) ON DELETE CASCADE,
            routing_instruction TEXT,
            priority INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_router_agent_destinations_router_agent_id "
        "ON router_agent_destinations (router_agent_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_router_agent_destinations_destination_agent_id "
        "ON router_agent_destinations (destination_agent_id)"
    )


def downgrade() -> None:
    """Revert Feature 012 router agent changes."""
    # Drop the association table first (has FK deps)
    op.execute("DROP TABLE IF EXISTS router_agent_destinations")
    op.execute("ALTER TABLE agent_config DROP COLUMN IF EXISTS fallback_agent_id")
    op.execute("ALTER TABLE agent_config DROP COLUMN IF EXISTS router_prompt")
    op.execute("DROP INDEX IF EXISTS ix_agent_config_agent_type")
    op.execute("ALTER TABLE agent_config DROP COLUMN IF EXISTS agent_type")
