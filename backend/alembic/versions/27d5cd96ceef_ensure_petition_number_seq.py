"""Ensure petition_number_seq exists and synchronize sequence

Revision ID: 27d5cd96ceef
Revises: 7163b1c7dc46
Create Date: 2026-09-25 15:50:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27d5cd96ceef'
down_revision: Union[str, None] = '7163b1c7dc46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the sequence safely if it does not already exist
    op.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS petition_number_seq
        START WITH 1
        INCREMENT BY 1
        """
    )

    # 2. Synchronize sequence with existing petitions to avoid duplicate numbers
    op.execute(
        """
        DO $$
        DECLARE
            max_num BIGINT;
            curr_val BIGINT;
        BEGIN
            SELECT COALESCE(
                MAX(CAST(SUBSTRING(petition_number FROM 8) AS BIGINT)),
                0
            )
            INTO max_num
            FROM petitions
            WHERE petition_number ~ '^IG-PET-[0-9]+$';

            IF max_num > 0 THEN
                SELECT last_value INTO curr_val FROM petition_number_seq;
                IF curr_val <= max_num THEN
                    PERFORM setval('petition_number_seq', max_num, true);
                END IF;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS petition_number_seq")
