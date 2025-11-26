"""add_forecasts_table

Revision ID: 7d50713679ef
Revises: g8h9i0j1k2l3
Create Date: 2025-11-26 14:51:23.051634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d50713679ef'
down_revision: Union[str, Sequence[str], None] = 'g8h9i0j1k2l3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create forecasts table."""
    op.create_table(
        'forecasts',
        sa.Column('forecast_id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('storm_id', sa.String(), nullable=False),
        sa.Column('nchmf', sa.JSON(), nullable=True),
        sa.Column('jtwc', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['storm_id'], ['storms.storm_id'], ),
        sa.PrimaryKeyConstraint('forecast_id')
    )


def downgrade() -> None:
    """Drop forecasts table."""
    op.drop_table('forecasts')
