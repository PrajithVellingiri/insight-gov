"""Initial schema: departments, users, petitions, ai_analysis, notifications, petition_history

Revision ID: 001
Revises:
Create Date: 2026-07-25 08:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # departments (no FK dependencies)
    # ------------------------------------------------------------------
    op.create_table(
        "departments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ------------------------------------------------------------------
    # users (depends on departments)
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column(
            "department_id",
            UUID(as_uuid=True),
            sa.ForeignKey("departments.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # petitions (depends on users and departments)
    # ------------------------------------------------------------------
    op.create_table(
        "petitions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column(
            "submitted_by",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "department_id",
            UUID(as_uuid=True),
            sa.ForeignKey("departments.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "officer_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "is_duplicate",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_petitions_status", "petitions", ["status"])
    op.create_index("ix_petitions_submitted_by", "petitions", ["submitted_by"])
    op.create_index("ix_petitions_department_id", "petitions", ["department_id"])

    # ------------------------------------------------------------------
    # ai_analysis (depends on petitions — one-to-one)
    # ------------------------------------------------------------------
    op.create_table(
        "ai_analysis",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "petition_id",
            UUID(as_uuid=True),
            sa.ForeignKey("petitions.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("priority", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("duplicate_ids", JSONB(), nullable=False, server_default="'[]'"),
        sa.Column("similarity_scores", JSONB(), nullable=False, server_default="'[]'"),
        sa.Column("explanation", JSONB(), nullable=False, server_default="'{}'"),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ------------------------------------------------------------------
    # notifications (depends on users)
    # ------------------------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # ------------------------------------------------------------------
    # petition_history (depends on petitions and users)
    # ------------------------------------------------------------------
    op.create_table(
        "petition_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "petition_id",
            UUID(as_uuid=True),
            sa.ForeignKey("petitions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "officer_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("old_status", sa.String(), nullable=True),
        sa.Column("new_status", sa.String(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_petition_history_petition_id", "petition_history", ["petition_id"]
    )


def downgrade() -> None:
    op.drop_table("petition_history")
    op.drop_table("notifications")
    op.drop_table("ai_analysis")
    op.drop_table("petitions")
    op.drop_table("users")
    op.drop_table("departments")
