from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class RoleEnum(str, enum.Enum):
    Admin = "Admin"
    Member = "Member"

class StatusEnum(str, enum.Enum):
    Pending = "Pending"
    In_Progress = "In Progress"
    Completed = "Completed"

class ProjectMember(Base):
    __tablename__ = "project_members"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.Member)

    projects = relationship("Project", secondary="project_members", back_populates="members")
    tasks = relationship("Task", back_populates="assignee")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)

    members = relationship("User", secondary="project_members", back_populates="projects")
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    status = Column(Enum(StatusEnum), default=StatusEnum.Pending)
    deadline = Column(DateTime)
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")
