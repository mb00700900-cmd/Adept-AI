"""
Profile model - Extended user information.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Profile(Base):
    """
    User profile for additional information.
    
    Attributes:
        id: UUID (same as user_id, one-to-one relationship)
        user_id: Foreign key to users table
        username: Display name (unique)
        email: Synced from user.email for team display
        created_at: Profile creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = "profiles"
    
    # Primary Key (same as user_id for one-to-one)
    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Profile Fields
    username = Column(String(50), unique=True, nullable=True, index=True)
    email = Column(String(255), nullable=True)  # Synced from auth.users
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    
    def __repr__(self) -> str:
        return f"<Profile(id={self.id}, username={self.username}, email={self.email})>"

