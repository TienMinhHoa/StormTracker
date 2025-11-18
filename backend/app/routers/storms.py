from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from databases import get_db
from schemas import storm_schemas as schemas
from models import storm_models as models
router = APIRouter(prefix="/storms", tags=["Storms"])

@router.post("/", response_model=schemas.Storm)
def create_storm(storm: schemas.StormCreate, db: Session = Depends(get_db)):
    db_storm = models.Storm(**storm.model_dump())
    db.add(db_storm)
    db.commit()
    db.refresh(db_storm)
    return db_storm

@router.get("/", response_model=list[schemas.Storm])
def get_storms(db: Session = Depends(get_db)):
    # Raise HTTPException if no storms found
    storms = db.query(models.Storm).all()
    if not storms:
        raise HTTPException(404, "No storms found")
    return storms

@router.get("/{storm_id}", response_model=schemas.Storm)
def get_storm(storm_id: int, db: Session = Depends(get_db)):
    storm = db.query(models.Storm).filter(models.Storm.storm_id == storm_id).first()
    if not storm:
        raise HTTPException(404, "Storm not found")
    return storm

@router.put("/{storm_id}", response_model=schemas.Storm)
def update_storm(storm_id: int, data: schemas.StormCreate, db: Session = Depends(get_db)):
    storm = db.query(models.Storm).filter(models.Storm.storm_id == storm_id).first()
    if not storm:
        raise HTTPException(404, "Storm not found")
    for key, value in data.dict().items():
        setattr(storm, key, value)
    db.commit()
    db.refresh(storm)
    return storm

@router.delete("/{storm_id}")
def delete_storm(storm_id: int, db: Session = Depends(get_db)):
    storm = db.query(models.Storm).filter(models.Storm.storm_id == storm_id).first()
    if not storm:
        raise HTTPException(404, "Storm not found")
    db.delete(storm)
    db.commit()
    return {"message": "Deleted"}
