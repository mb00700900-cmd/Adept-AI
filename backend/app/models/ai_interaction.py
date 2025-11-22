"""
AIInteraction model - Tracking AI suggestions and user modifications.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class AIInteraction(Base):
    """
    AI interaction tracking for analytics and improvement.
    
    Attributes:
        id: Unique interaction identifier (UUID)
        user_id: User who interacted with AI
        task_id: Associated task (if applicable)
        interaction_type: Type of AI interaction
        original_suggestion: AI's original suggestion (JSONB)
        user_modifications: User's changes (JSONB)
        accepted: Whether user accepted without modifications
        created_at: Interaction timestamp
    """
    
    __tablename__ = "ai_interactions"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Interaction Fields
    interaction_type = Column(String(50), nullable=False)  # e.g., "task_decompose", "priority_suggest"
    original_suggestion = Column(JSON, nullable=True)
    user_modifications = Column(JSON, nullable=True)
    accepted = Column(Boolean, default=False, nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="ai_interactions")
    task = relationship("Task", back_populates="ai_interactions")
    
    def __repr__(self) -> str:
        return f"<AIInteraction(id={self.id}, type={self.interaction_type}, accepted={self.accepted})>"

