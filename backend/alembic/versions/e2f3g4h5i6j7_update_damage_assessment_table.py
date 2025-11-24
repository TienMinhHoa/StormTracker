"""Update damage_assessment table

Revision ID: e2f3g4h5i6j7
Revises: d1b5326d6e03
Create Date: 2025-11-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e2f3g4h5i6j7'
down_revision: Union[str, Sequence[str], None] = 'd1b5326d6e03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - restructure damage_assessment table"""
    
    # Get all columns except id and storm_id
    op.execute("""
        DO $$ 
        DECLARE
            col_name text;
        BEGIN
            -- Drop all columns except id and storm_id
            FOR col_name IN 
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'damage_assessment' 
                AND column_name NOT IN ('id', 'storm_id')
            LOOP
                EXECUTE 'ALTER TABLE damage_assessment DROP COLUMN IF EXISTS ' || quote_ident(col_name) || ' CASCADE';
            END LOOP;
            
            -- Add new columns
            ALTER TABLE damage_assessment ADD COLUMN detail JSON NOT NULL DEFAULT '{}'::json;
            ALTER TABLE damage_assessment ADD COLUMN time TIMESTAMP NOT NULL DEFAULT NOW();
            ALTER TABLE damage_assessment ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE damage_assessment ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END $$;
    """)


def downgrade() -> None:
    """Downgrade schema"""
    
    # Remove new columns
    op.execute("""
        ALTER TABLE damage_assessment 
        DROP COLUMN IF EXISTS detail,
        DROP COLUMN IF EXISTS time,
        DROP COLUMN IF EXISTS created_at,
        DROP COLUMN IF EXISTS updated_at;
    """)
