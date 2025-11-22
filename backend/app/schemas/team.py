"""Team management schemas."""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models.project_member import ProjectRole

class InviteMember(BaseModel):
    email: EmailStr
    role: ProjectRole = ProjectRole.EDITOR

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = "member"  # "member" or "admin"

class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    email: str | None
    username: str | None
    role: ProjectRole
    joined_at: datetime
    
    class Config:
        from_attributes = True

class TeamMemberResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    joined_at: datetime

class InvitationResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    email: str
    role: str
    status: str
    token: str
    invited_by: int
    inviter_name: str
    expires_at: datetime
    created_at: datetime

class InvitationAccept(BaseModel):
    token: str

class UpdateMemberRole(BaseModel):
    role: ProjectRole

