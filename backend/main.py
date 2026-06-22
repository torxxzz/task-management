from fastapi import FastAPI, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
from models import TaskDB, CategoryDB
import time

from database import Base
Base.metadata.create_all(bind=engine)


class TaskCreate(BaseModel):
    title: str
    desc: str = ''
    priority: str = 'medium'
    category: str = ''
    due: str = ''


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    desc: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due: Optional[str] = None
    completed: Optional[bool] = None


class TaskOut(BaseModel):
    id: int
    title: str
    desc: str
    priority: str
    category: str
    due: str
    completed: bool
    createdAt: int

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    color: str
    bg: str
    text: str


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    bg: str
    text: str

    model_config = {"from_attributes": True}


app = FastAPI(title='Task Management API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/')
async def root():
    return {'message': 'Backend is running'}


def apply_sort(tasks, sort: str):
    if sort == 'priority':
        order = {'high': 0, 'medium': 1, 'low': 2}
        return sorted(tasks, key=lambda t: order.get(t.priority, 3))
    if sort == 'title':
        return sorted(tasks, key=lambda t: t.title.lower())
    if sort == 'due':
        return sorted(tasks, key=lambda t: t.due or '9999')
    return tasks


@app.get('/api/tasks', response_model=List[TaskOut])
async def get_tasks(
    filter: str = Query('all', pattern='^(all|active|completed)$'),
    search: str = '',
    sort: str = Query('created', pattern='^(created|priority|title|due)$'),
    category: str = '',
    db: Session = Depends(get_db),
):
    query = db.query(TaskDB).order_by(TaskDB.createdAt.desc())
    if filter == 'active':
        query = query.filter(TaskDB.completed == False)
    elif filter == 'completed':
        query = query.filter(TaskDB.completed == True)
    if category:
        query = query.filter(TaskDB.category == category)
    if search:
        q = f"%{search.lower()}%"
        query = query.filter(TaskDB.title.ilike(q) | TaskDB.desc.ilike(q))
    return apply_sort(query.all(), sort)


@app.get('/api/tasks/stats')
async def get_stats(db: Session = Depends(get_db)):
    total = db.query(TaskDB).count()
    completed = db.query(TaskDB).filter(TaskDB.completed == True).count()
    high_priority = db.query(TaskDB).filter(
        TaskDB.priority == 'high', TaskDB.completed == False
    ).count()
    return {
        'total': total,
        'active': total - completed,
        'completed': completed,
        'highPriority': high_priority,
    }


@app.post('/api/tasks', response_model=TaskOut, status_code=201)
async def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    task = TaskDB(**data.dict(), completed=False, createdAt=int(time.time() * 1000))
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.put('/api/tasks/{task_id}', response_model=TaskOut)
async def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    for key, value in data.dict(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@app.patch('/api/tasks/{task_id}', response_model=TaskOut)
async def patch_task(task_id: int, patch: TaskUpdate, db: Session = Depends(get_db)):
    return await update_task(task_id, patch, db)


@app.delete('/api/tasks/{task_id}', response_model=bool)
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    db.delete(task)
    db.commit()
    return True


@app.delete('/api/tasks')
async def delete_completed(completed: bool = Query(False), db: Session = Depends(get_db)):
    if not completed:
        raise HTTPException(status_code=400, detail='Must specify completed=true')
    deleted = db.query(TaskDB).filter(TaskDB.completed == True).delete()
    db.commit()
    return {'deleted': deleted}


# --- Category routes ---

@app.get('/api/categories', response_model=List[CategoryOut])
async def get_categories(db: Session = Depends(get_db)):
    return db.query(CategoryDB).all()


@app.post('/api/categories', response_model=CategoryOut, status_code=201)
async def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(CategoryDB).filter(CategoryDB.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail='Category already exists')
    cat = CategoryDB(**data.dict())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@app.delete('/api/categories/{name}')
async def delete_category(name: str, db: Session = Depends(get_db)):
    cat = db.query(CategoryDB).filter(CategoryDB.name == name).first()
    if not cat:
        raise HTTPException(status_code=404, detail='Category not found')
    db.delete(cat)
    db.commit()
    return True


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)