"""Update rescue_requests table

Revision ID: a1b2c3d4e5f6
Revises: f9a8b7c6d5e4
Create Date: 2025-11-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f9a8b7c6d5e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - restructure rescue_requests table"""
    
    # Drop foreign key constraint for social_post_id
    op.drop_constraint('rescue_requests_social_post_id_fkey', 'rescue_requests', type_='foreignkey')
    
    # Drop social_post_id column
    op.drop_column('rescue_requests', 'social_post_id')
    
    # Add new columns
    op.add_column('rescue_requests', sa.Column('name', sa.String(), nullable=True))
    op.add_column('rescue_requests', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('rescue_requests', sa.Column('priority', sa.Integer(), nullable=True))
    op.add_column('rescue_requests', sa.Column('status', sa.String(), nullable=True))
    op.add_column('rescue_requests', sa.Column('type', sa.Text(), nullable=True))
    op.add_column('rescue_requests', sa.Column('people_detail', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('rescue_requests', sa.Column('note', sa.Text(), nullable=True))
    
    # Copy data from severity to priority
    op.execute('UPDATE rescue_requests SET priority = severity')
    
    # Drop old severity column
    op.drop_column('rescue_requests', 'severity')
    
    # Alter created_at to have server_default
    op.alter_column('rescue_requests', 'created_at',
                    existing_type=sa.DateTime(),
                    server_default=sa.text('NOW()'),
                    existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema"""
    
    # Add back severity column
    op.add_column('rescue_requests', sa.Column('severity', sa.Integer(), nullable=True))
    
    # Copy data from priority to severity
    op.execute('UPDATE rescue_requests SET severity = priority')
    
    # Drop new columns
    op.drop_column('rescue_requests', 'note')
    op.drop_column('rescue_requests', 'people_detail')
    op.drop_column('rescue_requests', 'type')
    op.drop_column('rescue_requests', 'status')
    op.drop_column('rescue_requests', 'priority')
    op.drop_column('rescue_requests', 'address')
    op.drop_column('rescue_requests', 'name')
    
    # Re-add social_post_id with foreign key
    op.add_column('rescue_requests', sa.Column('social_post_id', sa.Integer(), nullable=True))
    op.create_foreign_key('rescue_requests_social_post_id_fkey', 'rescue_requests', 'social_posts', ['social_post_id'], ['post_id'])
    
    # Remove server_default from created_at
    op.alter_column('rescue_requests', 'created_at',
                    existing_type=sa.DateTime(),
                    server_default=None,
                    existing_nullable=True)
