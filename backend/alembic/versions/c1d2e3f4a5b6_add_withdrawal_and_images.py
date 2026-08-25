"""add petition withdrawal and images

Revision ID: c1d2e3f4a5b6
Revises: ab6b65f84608
Create Date: 2026-08-04 12:00:00.000000+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'ab6b65f84608'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Add withdrawal_reason to petitions ---
    op.add_column(
        'petitions',
        sa.Column('withdrawal_reason', sa.Text(), nullable=True),
    )

    # --- Create petition_images table ---
    op.create_table(
        'petition_images',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column(
            'petition_id',
            UUID(as_uuid=True),
            sa.ForeignKey('petitions.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('stored_path', sa.String(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        'ix_petition_images_petition_id',
        'petition_images',
        ['petition_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_petition_images_petition_id', table_name='petition_images')
    op.drop_table('petition_images')
    op.drop_column('petitions', 'withdrawal_reason')
