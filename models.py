from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class RoleEnum(str, enum.Enum):
    BGD = "Ban Giám đốc"
    TRUONG_PHO_PHONG = "Trưởng/Phó Phòng"
    NHAN_VIEN = "Nhân viên"

class TaskStatusEnum(str, enum.Enum):
    CHO_XU_LY = "Chờ xử lý"
    DANG_THUC_HIEN = "Đang thực hiện"
    CHO_DUYET = "Chờ duyệt"
    HOAN_THANH = "Hoàn thành"

class TaskPriorityEnum(str, enum.Enum):
    THAP = "Thấp"
    TRUNG_BINH = "Trung bình"
    CAO = "Cao"
    QUAN_TRONG = "Quan trọng"

class DepartmentThemeEnum(str, enum.Enum):
    BGD = "Tím"
    DAO_TAO = "Xanh lá - Emerald"
    HANH_CHINH = "Xanh dương - Blue"

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    theme = Column(String)  # DepartmentThemeEnum equivalent
    users = relationship("User", back_populates="department")
    tasks = relationship("Task", back_populates="department")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    role = Column(String)  # RoleEnum equivalent
    department_id = Column(Integer, ForeignKey("departments.id"))
    department = relationship("Department", back_populates="users")

    # Tasks where user is main assignee
    main_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")

    # Tasks where user is collaborator
    collaborations = relationship("TaskCollaborator", back_populates="user")

    # Audit logs
    audit_logs = relationship("AuditLog", back_populates="user")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    department = relationship("Department", back_populates="tasks")

    assignee_id = Column(Integer, ForeignKey("users.id"))
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="main_tasks")

    priority = Column(String)  # TaskPriorityEnum equivalent
    status = Column(String, default=TaskStatusEnum.CHO_XU_LY.value)  # TaskStatusEnum equivalent
    progress = Column(Integer, default=0) # 0 to 100
    evidence_link = Column(String, nullable=True) # Google Drive link
    deadline = Column(DateTime)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    collaborators = relationship("TaskCollaborator", back_populates="task", cascade="all, delete-orphan")

class TaskCollaborator(Base):
    __tablename__ = "task_collaborators"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    task = relationship("Task", back_populates="collaborators")
    user = relationship("User", back_populates="collaborations")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="audit_logs")
    action = Column(String)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
