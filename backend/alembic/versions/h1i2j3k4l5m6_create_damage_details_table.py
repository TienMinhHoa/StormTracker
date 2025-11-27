"""create_damage_details_table

Revision ID: h1i2j3k4l5m6
Revises: 7d50713679ef
Create Date: 2025-11-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h1i2j3k4l5m6'
down_revision: Union[str, Sequence[str], None] = '7d50713679ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create damage_details table."""
    op.create_table(
        'damage_details',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('storm_id', sa.String(), nullable=False),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('modified_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['storm_id'], ['storms.storm_id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Drop damage_details table."""
    op.drop_table('damage_details')
