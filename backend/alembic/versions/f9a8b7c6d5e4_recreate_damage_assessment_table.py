"""Recreate damage_assessment table

Revision ID: f9a8b7c6d5e4
Revises: e2f3g4h5i6j7
Create Date: 2025-11-24 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f9a8b7c6d5e4'
down_revision: Union[str, Sequence[str], None] = 'e2f3g4h5i6j7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop (if exists) and recreate `damage_assessment` table to match model."""

    # Drop existing table if it exists to ensure a clean recreate.
    op.execute("DROP TABLE IF EXISTS damage_assessment CASCADE;")

    # Create table matching `src.models.DamageAssessment`
    op.create_table(
        'damage_assessment',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('storm_id', sa.String(), sa.ForeignKey('storms.storm_id'), nullable=False),
        sa.Column('detail', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('time', sa.TIMESTAMP(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('NOW()')),
    )


def downgrade() -> None:
    """Remove the `damage_assessment` table."""

    op.execute("DROP TABLE IF EXISTS damage_assessment CASCADE;")
