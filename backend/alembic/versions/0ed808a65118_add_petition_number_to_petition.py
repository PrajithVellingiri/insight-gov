"""Add petition_number to Petition

Revision ID: 0ed808a65118
Revises: ffdabc083348
Create Date: 2026-08-13 09:10:55.194465+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ed808a65118'
down_revision: Union[str, None] = 'ffdabc083348'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create sequence
    op.execute("CREATE SEQUENCE petition_number_seq")

    # 2. Add column as nullable
    op.add_column('petitions', sa.Column('petition_number', sa.String(), nullable=True))

    # 3. Backfill existing petitions
    op.execute("UPDATE petitions SET petition_number = 'IG-PET-' || TO_CHAR(nextval('petition_number_seq'), 'fm000000')")

    # 4. Make column not null
    op.alter_column('petitions', 'petition_number', nullable=False)

    # 5. Create index
    op.create_index(op.f('ix_petitions_petition_number'), 'petitions', ['petition_number'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_petitions_petition_number'), table_name='petitions')
    op.drop_column('petitions', 'petition_number')
    op.execute("DROP SEQUENCE IF EXISTS petition_number_seq")
