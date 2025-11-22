
"""
Task model - Individual tasks within projects.
"""

import enum
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class TaskPriority(str, enum.Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, enum.Enum):
    """Task status types."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class CreatedByType(str, enum.Enum):
    """Who created the task."""
    AI = "ai"
    USER = "user"


class Task(Base):
    """
    Task model for project tasks.
    
    Attributes:
        id: Unique task identifier (UUID)
        project_id: Associated project ID
        title: Task title
        description: Task description (optional)
        priority: Task priority (low, medium, high)
        status: Task status (todo, in_progress, done)
        effort_estimate: Estimated hours to complete
        ai_generated: Whether task was AI-generated
        ai_priority_suggestion: Original AI priority suggestion
        ai_effort_suggestion: Original AI effort suggestion
        created_by: Who created the task (ai or user)
        created_at: Creation timestamp
        updated_at: Last update timestamp
        modified_at: Last modification timestamp
    """
    
    __tablename__ = "tasks"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign Keys
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Task Fields
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False, index=True)
    effort_estimate = Column(Integer, nullable=True)  # in hours
    
    # AI Tracking Fields
    ai_generated = Column(Boolean, default=False, nullable=False)
    ai_priority_suggestion = Column(Enum(TaskPriority), nullable=True)
    ai_effort_suggestion = Column(Integer, nullable=True)
    created_by = Column(Enum(CreatedByType), default=CreatedByType.USER, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    ai_interactions = relationship("AIInteraction", back_populates="task", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"
    
    @property
    def was_modified(self) -> bool:
        """Check if AI-generated task was modified by user."""
        if not self.ai_generated:
            return False
        return (
            self.priority != self.ai_priority_suggestion or
            self.effort_estimate != self.ai_effort_suggestion
        )

