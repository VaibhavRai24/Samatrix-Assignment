from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, StatusEnum

class UserCreate(BaseModel):
    username: str
    password: str
    role: RoleEnum = RoleEnum.Member

class UserOut(BaseModel):
    id: int
    username: str
    role: RoleEnum
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None
    user_id: Optional[int] = None

class ProjectCreate(BaseModel):
    name: str
    description: str

class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    members: List[UserOut] = []
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: str
    deadline: datetime
    project_id: int
    user_id: int

class TaskUpdate(BaseModel):
    status: StatusEnum

class TaskOut(BaseModel):
    id: int
    title: str
    description: str
    status: StatusEnum
    deadline: datetime
    project_id: int
    user_id: int
    assignee: Optional[UserOut] = None
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    status_distribution: dict
