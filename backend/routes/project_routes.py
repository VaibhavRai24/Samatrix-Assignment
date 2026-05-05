from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
from typing import List

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=schemas.ProjectOut)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    new_project = models.Project(name=project.name, description=project.description)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/", response_model=List[schemas.ProjectOut])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == models.RoleEnum.Admin:
        return db.query(models.Project).all()
    return current_user.projects

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"detail": "Project deleted"}

@router.post("/{project_id}/members/{user_id}")
def add_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not project or not user:
        raise HTTPException(status_code=404, detail="Project or user not found")
    
    existing = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already in project")
    
    member_link = models.ProjectMember(project_id=project_id, user_id=user_id)
    db.add(member_link)
    db.commit()
    return {"detail": "Member added to project"}

@router.delete("/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    link = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Member not found in project")
    db.delete(link)
    db.commit()
    return {"detail": "Member removed"}
