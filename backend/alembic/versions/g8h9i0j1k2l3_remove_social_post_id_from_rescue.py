"""Remove social_post_id from rescue_requests

Revision ID: g8h9i0j1k2l3
Revises: a1b2c3d4e5f6
Create Date: 2025-11-25 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'g8h9i0j1k2l3'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove social_post_id column and its foreign key"""
    
    # Drop foreign key constraint first
    op.drop_constraint('rescue_requests_social_post_id_fkey', 'rescue_requests', type_='foreignkey')
    
    # Drop the social_post_id column
    op.drop_column('rescue_requests', 'social_post_id')


def downgrade() -> None:
    """Re-add social_post_id column with foreign key"""
    
    # Add back social_post_id column
    op.add_column('rescue_requests', sa.Column('social_post_id', sa.Integer(), nullable=True))
    
    # Re-create foreign key constraint
    op.create_foreign_key(
        'rescue_requests_social_post_id_fkey',
        'rescue_requests',
        'social_posts',
        ['social_post_id'],
        ['post_id']
    )
