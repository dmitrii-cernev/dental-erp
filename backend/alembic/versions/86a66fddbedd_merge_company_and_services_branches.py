"""merge company and services branches

Revision ID: 86a66fddbedd
Revises: 8b52df91ded5, 97f82ecab18d
Create Date: 2026-03-22 13:25:21.118390

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '86a66fddbedd'
down_revision: Union[str, None] = ('8b52df91ded5', '97f82ecab18d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
