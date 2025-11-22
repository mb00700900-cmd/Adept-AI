"""
Analytics API endpoints.
Provides statistics and insights about projects and tasks.
"""

from typing import Any, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.project_member import ProjectMember
from app.schemas.analytics import (
    KPIResponse,
    TaskTrendResponse,
    PriorityDistributionResponse,
    StatusDistributionResponse
)

router = APIRouter()


def get_user_projects(db: Session, user_id: int) -> List[int]:
    """Get all project IDs the user has access to."""
    # Projects owned by user
    owned_projects = db.query(Project.id).filter(Project.owner_id == user_id).all()
    
    # Projects where user is a member
    member_projects = db.query(ProjectMember.project_id).filter(
        ProjectMember.user_id == user_id
    ).all()
    
    project_ids = [p[0] for p in owned_projects] + [p[0] for p in member_projects]
    return list(set(project_ids))


@router.get("/kpis", response_model=KPIResponse)
def get_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get key performance indicators for the current user.
    Includes total projects, tasks, and completion metrics.
    """
    # Get user's projects
    project_ids = get_user_projects(db, current_user.id)
    
    if not project_ids:
        return KPIResponse(
            total_projects=0,
            total_tasks=0,
            completed_tasks=0,
            in_progress_tasks=0,
            completion_rate=0.0,
            avg_completion_time=None
        )
    
    # Total projects
    total_projects = len(project_ids)
    
    # Task statistics
    total_tasks = db.query(func.count(Task.id)).filter(
        Task.project_id.in_(project_ids)
    ).scalar()
    
    completed_tasks = db.query(func.count(Task.id)).filter(
        and_(
            Task.project_id.in_(project_ids),
            Task.status == "completed"
        )
    ).scalar()
    
    in_progress_tasks = db.query(func.count(Task.id)).filter(
        and_(
            Task.project_id.in_(project_ids),
            Task.status == "in_progress"
        )
    ).scalar()
    
    # Completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    # Average completion time (in days)
    completed_tasks_with_dates = db.query(Task).filter(
        and_(
            Task.project_id.in_(project_ids),
            Task.status == "completed",
            Task.completed_at.isnot(None)
        )
    ).all()
    
    avg_completion_time = None
    if completed_tasks_with_dates:
        total_days = sum([
            (task.completed_at - task.created_at).days 
            for task in completed_tasks_with_dates
        ])
        avg_completion_time = round(total_days / len(completed_tasks_with_dates), 1)
    
    return KPIResponse(
        total_projects=total_projects,
        total_tasks=total_tasks or 0,
        completed_tasks=completed_tasks or 0,
        in_progress_tasks=in_progress_tasks or 0,
        completion_rate=round(completion_rate, 1),
        avg_completion_time=avg_completion_time
    )


@router.get("/task-trends", response_model=List[TaskTrendResponse])
def get_task_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get task creation and completion trends over the last 30 days.
    Returns daily counts of created and completed tasks.
    """
    # Get user's projects
    project_ids = get_user_projects(db, current_user.id)
    
    if not project_ids:
        return []
    
    # Get date range (last 30 days)
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=29)
    
    # Initialize response with all dates
    trends = []
    current_date = start_date
    
    while current_date <= end_date:
        # Count tasks created on this date
        created_count = db.query(func.count(Task.id)).filter(
            and_(
                Task.project_id.in_(project_ids),
                func.date(Task.created_at) == current_date
            )
        ).scalar()
        
        # Count tasks completed on this date
        completed_count = db.query(func.count(Task.id)).filter(
            and_(
                Task.project_id.in_(project_ids),
                Task.status == "completed",
                func.date(Task.completed_at) == current_date
            )
        ).scalar()
        
        trends.append(TaskTrendResponse(
            date=current_date,
            created=created_count or 0,
            completed=completed_count or 0
        ))
        
        current_date += timedelta(days=1)
    
    return trends


@router.get("/priority-distribution", response_model=List[PriorityDistributionResponse])
def get_priority_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get distribution of tasks by priority level.
    Returns counts for low, medium, and high priority tasks.
    """
    # Get user's projects
    project_ids = get_user_projects(db, current_user.id)
    
    if not project_ids:
        return [
            PriorityDistributionResponse(priority="low", count=0),
            PriorityDistributionResponse(priority="medium", count=0),
            PriorityDistributionResponse(priority="high", count=0)
        ]
    
    # Get counts by priority
    priority_counts = db.query(
        Task.priority,
        func.count(Task.id).label('count')
    ).filter(
        Task.project_id.in_(project_ids)
    ).group_by(Task.priority).all()
    
    # Convert to dict for easy lookup
    counts_dict = {p: c for p, c in priority_counts}
    
    # Return all priorities with counts
    return [
        PriorityDistributionResponse(
            priority="low",
            count=counts_dict.get("low", 0)
        ),
        PriorityDistributionResponse(
            priority="medium",
            count=counts_dict.get("medium", 0)
        ),
        PriorityDistributionResponse(
            priority="high",
            count=counts_dict.get("high", 0)
        )
    ]


@router.get("/status-distribution", response_model=List[StatusDistributionResponse])
def get_status_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get distribution of tasks by status.
    Returns counts for todo, in_progress, and completed tasks.
    """
    # Get user's projects
    project_ids = get_user_projects(db, current_user.id)
    
    if not project_ids:
        return [
            StatusDistributionResponse(status="todo", count=0),
            StatusDistributionResponse(status="in_progress", count=0),
            StatusDistributionResponse(status="completed", count=0)
        ]
    
    # Get counts by status
    status_counts = db.query(
        Task.status,
        func.count(Task.id).label('count')
    ).filter(
        Task.project_id.in_(project_ids)
    ).group_by(Task.status).all()
    
    # Convert to dict for easy lookup
    counts_dict = {s: c for s, c in status_counts}
    
    # Return all statuses with counts
    return [
        StatusDistributionResponse(
            status="todo",
            count=counts_dict.get("todo", 0)
        ),
        StatusDistributionResponse(
            status="in_progress",
            count=counts_dict.get("in_progress", 0)
        ),
        StatusDistributionResponse(
            status="completed",
            count=counts_dict.get("completed", 0)
        )
    ]

