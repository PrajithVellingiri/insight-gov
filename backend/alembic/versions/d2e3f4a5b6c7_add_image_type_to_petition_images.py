"""add image type to petition images

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-08-04 12:30:00.000000+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Add image_type to petition_images ---
    op.add_column(
        'petition_images',
        sa.Column('image_type', sa.String(), server_default='petition', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('petition_images', 'image_type')
