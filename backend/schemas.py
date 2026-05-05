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

class TaskBase(BaseModel):
    title: str
    description: str
    deadline: datetime
    project_id: int
    user_id: int

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: Optional[StatusEnum] = None

class TaskSubmissionBase(BaseModel):
    submission_url: str
    tags: str
    description: str

class TaskSubmissionCreate(TaskSubmissionBase):
    pass

class TaskSubmission(TaskSubmissionBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class TaskOut(TaskBase):
    id: int
    status: StatusEnum
    assignee: Optional[UserOut] = None
    submissions: List[TaskSubmission] = []
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    status_distribution: dict
