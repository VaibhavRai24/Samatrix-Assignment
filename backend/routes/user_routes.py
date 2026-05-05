from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[schemas.UserOut])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return db.query(models.User).all()

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
