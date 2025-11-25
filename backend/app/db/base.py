from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here for Alembic - moved to separate file to avoid circular imports
# Models will be imported in app.db.base_models
