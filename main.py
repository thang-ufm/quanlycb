from fastapi import FastAPI, Request, Depends, Form, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse
import os

from database import SessionLocal, engine, get_db, Base
import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hệ Thống Quản Lý Công Việc")

# Mount static files and templates
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def seed_db():
    db = SessionLocal()
    # Add departments if not exist
    if not db.query(models.Department).first():
        depts = [
            models.Department(name="Ban Giám đốc", theme=models.DepartmentThemeEnum.BGD.value),
            models.Department(name="Phòng Đào tạo-KH&QLSV", theme=models.DepartmentThemeEnum.DAO_TAO.value),
            models.Department(name="Phòng Hành chính - Tài vụ", theme=models.DepartmentThemeEnum.HANH_CHINH.value)
        ]
        db.add_all(depts)
        db.commit()

    # Add users if not exist
    if not db.query(models.User).first():
        bgd_dept = db.query(models.Department).filter(models.Department.name == "Ban Giám đốc").first()
        dao_tao_dept = db.query(models.Department).filter(models.Department.name == "Phòng Đào tạo-KH&QLSV").first()
        hanh_chinh_dept = db.query(models.Department).filter(models.Department.name == "Phòng Hành chính - Tài vụ").first()

        users = [
            models.User(username="director", full_name="Giám đốc A", role=models.RoleEnum.BGD.value, department=bgd_dept),
            models.User(username="head_dt", full_name="Trưởng phòng ĐT", role=models.RoleEnum.TRUONG_PHO_PHONG.value, department=dao_tao_dept),
            models.User(username="staff_dt1", full_name="Nhân viên ĐT 1", role=models.RoleEnum.NHAN_VIEN.value, department=dao_tao_dept),
            models.User(username="staff_dt2", full_name="Nhân viên ĐT 2", role=models.RoleEnum.NHAN_VIEN.value, department=dao_tao_dept),
            models.User(username="head_hc", full_name="Trưởng phòng HC", role=models.RoleEnum.TRUONG_PHO_PHONG.value, department=hanh_chinh_dept),
            models.User(username="staff_hc1", full_name="Nhân viên HC 1", role=models.RoleEnum.NHAN_VIEN.value, department=hanh_chinh_dept)
        ]
        db.add_all(users)
        db.commit()
    db.close()

# Initialize dummy data on startup
@app.on_event("startup")
def on_startup():
    seed_db()

@app.get("/")
def read_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    dept_filter: int = None,
    status_filter: str = None,
    my_tasks_user_id: int = None,
    page: int = 1
):
    limit = 15
    skip = (page - 1) * limit

    query = db.query(models.Task)

    if dept_filter:
        query = query.filter(models.Task.department_id == dept_filter)

    if status_filter:
        query = query.filter(models.Task.status == status_filter)

    if my_tasks_user_id:
        query = query.filter(models.Task.assignee_id == my_tasks_user_id)

    total_tasks = query.count()
    tasks = query.offset(skip).limit(limit).all()

    departments = db.query(models.Department).all()
    users = db.query(models.User).all()

    # For simulation, just picking the first user as "current_user"
    current_user = db.query(models.User).first()

    return templates.TemplateResponse(request=request, name="dashboard.html", context={
        "request": request,
        "tasks": tasks,
        "departments": departments,
        "users": users,
        "current_user": current_user,
        "page": page,
        "total_pages": (total_tasks + limit - 1) // limit,
        "dept_filter": dept_filter,
        "status_filter": status_filter,
        "my_tasks_user_id": my_tasks_user_id
    })

from typing import List
from pydantic import BaseModel
from fastapi import Body

class TaskCreate(BaseModel):
    title: str
    description: str = None
    department_id: int
    assignee_id: int
    priority: str
    deadline: datetime
    collaborator_ids: List[int] = []

@app.post("/tasks/batch")
def create_tasks_batch(tasks: List[TaskCreate] = Body(...), db: Session = Depends(get_db)):
    try:
        current_user = db.query(models.User).first() # Simulation
        for task_data in tasks:
            new_task = models.Task(
                title=task_data.title,
                description=task_data.description,
                department_id=task_data.department_id,
                assignee_id=task_data.assignee_id,
                priority=task_data.priority,
                deadline=task_data.deadline
            )
            db.add(new_task)
            db.flush() # get new_task.id

            for coll_id in task_data.collaborator_ids:
                collab = models.TaskCollaborator(task_id=new_task.id, user_id=coll_id)
                db.add(collab)

            audit = models.AuditLog(user_id=current_user.id, action="CREATE_TASK", details=f"Created task {new_task.title}")
            db.add(audit)

        db.commit()
        return {"message": "Tasks registered successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/export/excel")
def export_excel(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()

    data = []
    for t in tasks:
        collab_names = ", ".join([c.user.full_name for c in t.collaborators])
        data.append({
            "STT": t.id,
            "TÊN CÔNG VIỆC": t.title,
            "ĐƠN VỊ CHỦ TRÌ": t.department.name if t.department else "",
            "NGƯỜI THỰC HIỆN CHÍNH": t.assignee.full_name if t.assignee else "",
            "NGƯỜI PHỐI HỢP": collab_names,
            "ƯU TIÊN": t.priority,
            "TRẠNG THÁI": t.status,
            "TIẾN ĐỘ (%)": t.progress,
            "MINH CHỨNG": t.evidence_link or "",
            "HẠN CHÓT": t.deadline.strftime("%Y-%m-%d") if t.deadline else ""
        })

    df = pd.DataFrame(data)

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Tasks')

    output.seek(0)

    headers = {
        'Content-Disposition': 'attachment; filename="Bao_Cao_Cong_Viec.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
