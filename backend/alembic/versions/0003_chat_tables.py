"""add chat tables

Revision ID: 0003_chat_tables
Revises: 12ea3f09fc2b
Create Date: 2026-08-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003_chat_tables"
down_revision: Union[str, None] = "12ea3f09fc2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "last_active_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_chat_sessions_user_id", "chat_sessions", ["user_id"])
    op.create_index(
        "ix_chat_sessions_last_active", "chat_sessions", ["last_active_at"]
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("feedback", sa.String(16), nullable=True),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_chat_messages_session_id", "chat_messages", ["session_id"])
    op.create_index(
        "ix_chat_messages_session_created",
        "chat_messages",
        ["session_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
