"""
ProjectMember model - Team collaboration with role-based access.
"""

import enum
from sqlalchemy import Column, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class ProjectRole(str, enum.Enum):
    """Project member roles with different permission levels."""
    OWNER = "Owner"
    EDITOR = "Editor"
    VIEWER = "Viewer"


class ProjectMember(Base):
    """
    Project membership with role-based access control.
    
    Attributes:
        id: Unique membership identifier (UUID)
        project_id: Associated project ID
        user_id: Member's user ID
        role: Member's role (Owner, Editor, Viewer)
        joined_at: When the user joined the project
    """
    
    __tablename__ = "project_members"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Member Fields
    role = Column(Enum(ProjectRole), default=ProjectRole.EDITOR, nullable=False)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('project_id', 'user_id', name='uq_project_user'),
    )
    
    def __repr__(self) -> str:
        return f"<ProjectMember(project_id={self.project_id}, user_id={self.user_id}, role={self.role})>"

