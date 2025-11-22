"""Task schemas."""
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from app.models.task import TaskPriority, TaskStatus, CreatedByType

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    effort_estimate: Optional[int] = Field(None, ge=0)
    ai_generated: bool = False
    created_by: CreatedByType = CreatedByType.USER

class TaskBulkCreate(BaseModel):
    tasks: List[TaskCreate]

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    effort_estimate: Optional[int] = Field(None, ge=0)

class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    priority: TaskPriority
    status: TaskStatus
    effort_estimate: Optional[int]
    ai_generated: bool
    ai_priority_suggestion: Optional[TaskPriority]
    ai_effort_suggestion: Optional[int]
    created_by: CreatedByType
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AITaskSuggestion(BaseModel):
    title: str
    description: str
    priority: TaskPriority
    priority_reasoning: str
    effort_estimate: int
    effort_confidence: str
    effort_reasoning: str

