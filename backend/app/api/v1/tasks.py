"""
Tasks API endpoints.
Handles task CRUD operations and bulk creation.
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.project_member import ProjectMember
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskBulkCreate

router = APIRouter()


def check_project_access(project_id: str, user_id: str, db: Session, min_role: str = "Viewer") -> None:
    """
    Check if user has access to project with minimum role.
    Raises HTTPException if not authorized.
    """
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    # Check role permissions (Owner > Editor > Viewer)
    roles_hierarchy = {"Owner": 3, "Editor": 2, "Viewer": 1}
    if roles_hierarchy.get(member.role, 0) < roles_hierarchy.get(min_role, 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Requires {min_role} role or higher"
        )


@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
def list_project_tasks(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get all tasks for a specific project.
    User must be a member of the project.
    """
    check_project_access(project_id, current_user.id, db, "Viewer")
    
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return tasks


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: str,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new task in a project.
    User must be Editor or Owner.
    """
    check_project_access(project_id, current_user.id, db, "Editor")
    
    new_task = Task(
        project_id=project_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        status=task_data.status if task_data.status else "todo",
        effort_estimate=task_data.effort_estimate,
        ai_generated=task_data.ai_generated if task_data.ai_generated is not None else False,
        ai_priority_suggestion=task_data.ai_priority_suggestion,
        ai_effort_suggestion=task_data.ai_effort_suggestion,
        created_by=task_data.created_by if task_data.created_by else "user"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task


@router.post("/projects/{project_id}/tasks/bulk", response_model=List[TaskResponse], status_code=status.HTTP_201_CREATED)
def create_tasks_bulk(
    project_id: str,
    bulk_data: TaskBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create multiple tasks at once (for AI-generated tasks).
    User must be Editor or Owner.
    """
    check_project_access(project_id, current_user.id, db, "Editor")
    
    created_tasks = []
    for task_data in bulk_data.tasks:
        new_task = Task(
            project_id=project_id,
            title=task_data.title,
            description=task_data.description,
            priority=task_data.priority,
            status=task_data.status if task_data.status else "todo",
            effort_estimate=task_data.effort_estimate,
            ai_generated=task_data.ai_generated if task_data.ai_generated is not None else False,
            ai_priority_suggestion=task_data.ai_priority_suggestion,
            ai_effort_suggestion=task_data.ai_effort_suggestion,
            created_by=task_data.created_by if task_data.created_by else "user"
        )
        db.add(new_task)
        created_tasks.append(new_task)
    
    db.commit()
    
    # Refresh all tasks
    for task in created_tasks:
        db.refresh(task)
    
    return created_tasks


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a task.
    User must be Editor or Owner of the project.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    check_project_access(task.project_id, current_user.id, db, "Editor")
    
    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.effort_estimate is not None:
        task.effort_estimate = task_data.effort_estimate
    
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete a task.
    User must be Editor or Owner of the project.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    check_project_access(task.project_id, current_user.id, db, "Editor")
    
    db.delete(task)
    db.commit()
    
    return None

