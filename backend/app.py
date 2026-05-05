from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import enum

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
    title = Column(String)
    description = Column(String)
    status = Column(String, default="Pending")
    deadline = Column(DateTime)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    assignee = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    submissions = relationship("TaskSubmission", back_populates="task", cascade="all, delete-orphan")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    submission_url = Column(String)
    tags = Column(String)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="submissions")
    user = relationship("User")


class ProjectSubmission(Base):
    __tablename__ = "project_submissions"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    link = Column(String)
    notes = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)

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

class ProjectCreate(BaseModel):
    name: str
    description: str

class SubmissionOut(BaseModel):
    id: int
    link: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[int] = None
    class Config:
        from_attributes = True

class ProjectOut(BaseModel):
    id: int
    name: Optional[str] = None
    description: Optional[str] = None
    members: List[UserOut] = []
    submissions: List[SubmissionOut] = []
    class Config:
        from_attributes = True

Project.submissions = relationship("ProjectSubmission", backref="project")

class SubmissionCreate(BaseModel):
    link: str
    notes: str

class TaskSubmissionCreate(BaseModel):
    submission_url: str
    tags: str
    description: str

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
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StatusEnum] = None
    deadline: Optional[datetime] = None
    project_id: Optional[int] = None
    user_id: Optional[int] = None
    assignee: Optional[UserOut] = None
    project: Optional[ProjectOut] = None
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.Admin:
        raise HTTPException(status_code=403, detail="Not permitted")
    return current_user

# Database Migration Helper
def migrate_db():
    import sqlite3
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN submission_link TEXT")
        cursor.execute("ALTER TABLE tasks ADD COLUMN submission_notes TEXT")
    except:
        pass
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                user_id INTEGER,
                submission_url TEXT,
                tags TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(task_id) REFERENCES tasks(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        conn.commit()
    except Exception as e:
        print(f"Migration error: {e}")
    conn.close()

migrate_db()

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username exists")
    new_user = User(username=user.username, hashed_password=pwd_context.hash(user.password), role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    token = jwt.encode(
        {"sub": user.username, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)},
        SECRET_KEY, algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user

@app.get("/users/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).all()

@app.post("/projects/", response_model=ProjectOut)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    new_project = Project(name=project.name, description=project.description)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects/", response_model=List[ProjectOut])
def get_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == RoleEnum.Admin:
        return db.query(Project).all()
    return user.projects

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        db.delete(project)
        db.commit()
    return {"detail": "Deleted"}

@app.delete("/projects/{project_id}/leave")
def leave_project(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    link = db.query(ProjectMember).filter_by(project_id=project_id, user_id=user.id).first()
    if link:
        db.delete(link)
        db.commit()
    return {"detail": "Left project"}

@app.post("/projects/{project_id}/submit")
def submit_project(project_id: int, submission: SubmissionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = ProjectSubmission(project_id=project_id, user_id=user.id, link=submission.link, notes=submission.notes)
    db.add(sub)
    db.commit()
    return {"detail": "Submitted"}

@app.post("/projects/{project_id}/members/{user_id}")
def add_member(project_id: int, user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if not db.query(ProjectMember).filter_by(project_id=project_id, user_id=user_id).first():
        db.add(ProjectMember(project_id=project_id, user_id=user_id))
        db.commit()
    return {"detail": "Added"}

@app.post("/tasks/", response_model=TaskOut)
def create_task(task: TaskCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    new_task = Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/tasks/", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == RoleEnum.Admin:
        return db.query(Task).all()
    
    project_ids = [p.id for p in user.projects]
    return db.query(Task).filter(
        (Task.user_id == user.id) | (Task.project_id.in_(project_ids))
    ).all()

@app.put("/tasks/{task_id}", response_model=TaskOut)
def update_task_status(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or (user.role != RoleEnum.Admin and task.user_id != user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    task.status = task_update.status
    db.commit()
    db.refresh(task)
    return task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if task:
        db.delete(task)
        db.commit()
    return {"detail": "Deleted"}

@app.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Task)
    if user.role != RoleEnum.Admin:
        query = query.filter(Task.user_id == user.id)
    tasks = query.all()
    now = datetime.utcnow()
    return DashboardStats(
        total_tasks=len(tasks),
        completed_tasks=sum(1 for t in tasks if t.status == StatusEnum.Completed),
        pending_tasks=sum(1 for t in tasks if t.status != StatusEnum.Completed),
        overdue_tasks=sum(1 for t in tasks if t.deadline < now and t.status != StatusEnum.Completed)
    )

# Routes for Task Submissions
@app.post("/tasks/{task_id}/submit")
def submit_task(task_id: int, submission: TaskSubmissionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task: raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != current_user.id: raise HTTPException(status_code=403, detail="Not assigned to this task")
    
    db_sub = TaskSubmission(**submission.model_dump(), task_id=task_id, user_id=current_user.id)
    task.status = "Completed"
    db.add(db_sub)
    db.commit()
    return {"message": "Task submitted successfully"}

@app.get("/tasks/{task_id}/submissions")
def get_task_submissions(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task: raise HTTPException(status_code=404, detail="Task not found")
    
    query = db.query(TaskSubmission).filter(TaskSubmission.task_id == task_id)
    if current_user.role != "Admin":
        query = query.filter(TaskSubmission.user_id == current_user.id)
    
    return query.all()
