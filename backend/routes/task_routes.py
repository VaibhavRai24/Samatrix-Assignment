from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
from typing import List
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=schemas.TaskOut)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    new_task = models.Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=List[schemas.TaskOut])
def get_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == models.RoleEnum.Admin:
        return db.query(models.Task).all()
    return db.query(models.Task).filter(models.Task.user_id == current_user.id).all()

@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task_status(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role != models.RoleEnum.Admin and task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    task.status = task_update.status
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted"}

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Task)
    if current_user.role != models.RoleEnum.Admin:
        query = query.filter(models.Task.user_id == current_user.id)
    
    tasks = query.all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == models.StatusEnum.Completed)
    pending = sum(1 for t in tasks if t.status == models.StatusEnum.Pending)
    in_progress = sum(1 for t in tasks if t.status == models.StatusEnum.In_Progress)
    
    now = datetime.utcnow()
    overdue = sum(1 for t in tasks if t.deadline < now and t.status != models.StatusEnum.Completed)
    
    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending + in_progress,
        "overdue_tasks": overdue,
        "status_distribution": {
            "Pending": pending,
            "In Progress": in_progress,
            "Completed": completed
        }
    }
