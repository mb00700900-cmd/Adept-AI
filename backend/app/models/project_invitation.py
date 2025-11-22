"""
ProjectInvitation model - Team invitations with token-based acceptance.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import secrets

from app.database import Base
from app.models.project_member import ProjectRole


class ProjectInvitation(Base):
    """
    Project invitation for adding team members.
    
    Attributes:
        id: Unique invitation identifier (UUID)
        project_id: Associated project ID
        invited_by_user_id: Who sent the invitation
        invited_email: Email address of invitee
        role: Role to assign when accepted
        invitation_token: Unique token for acceptance
        accepted_by_user_id: Who accepted (null if pending)
        accepted_at: When invitation was accepted
        expires_at: Expiration timestamp (7 days from creation)
        created_at: Creation timestamp
    """
    
    __tablename__ = "project_invitations"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    accepted_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Invitation Fields
    invited_email = Column(String(255), nullable=False)
    role = Column(Enum(ProjectRole), default=ProjectRole.EDITOR, nullable=False)
    invitation_token = Column(String(64), unique=True, nullable=False, index=True, default=lambda: secrets.token_urlsafe(32))
    
    # Timestamps
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # Set to now() + 7 days
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="invitations")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('project_id', 'invited_email', name='uq_project_email'),
    )
    
    def __repr__(self) -> str:
        return f"<ProjectInvitation(id={self.id}, invited_email={self.invited_email}, role={self.role})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if invitation has expired."""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc) > self.expires_at
    
    @property
    def is_accepted(self) -> bool:
        """Check if invitation has been accepted."""
        return self.accepted_at is not None
    
    @property
    def is_pending(self) -> bool:
        """Check if invitation is still pending."""
        return not self.is_accepted and not self.is_expired

