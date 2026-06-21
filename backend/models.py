from sqlalchemy import Column, Integer, String, Boolean, BigInteger
from database import Base


class TaskDB(Base):
    __tablename__ = "tasks"

    id        = Column(Integer, primary_key=True)
    title     = Column(String, nullable=False)
    desc      = Column(String, default="")
    priority  = Column(String, default="medium")
    category  = Column(String, default="")
    due       = Column(String, default="")
    completed = Column(Boolean, default=False)
    createdAt = Column(BigInteger)


class CategoryDB(Base):
    __tablename__ = "categories"

    id    = Column(Integer, primary_key=True)
    name  = Column(String, nullable=False, unique=True)
    color = Column(String, nullable=False)
    bg    = Column(String, nullable=False)
    text  = Column(String, nullable=False)