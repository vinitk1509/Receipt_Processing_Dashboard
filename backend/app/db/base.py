# Import Base and all models so Alembic or Base.metadata.create_all picks them up
from app.db.database import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.receipt import Receipt  # noqa: F401
