"""
Team API endpoints.
Handles project members and invitations.
"""

from typing import Any, List
from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.project_invitation import ProjectInvitation
from app.models.profile import Profile
from app.schemas.team import (
    TeamMemberResponse,
    InvitationCreate,
    InvitationResponse,
    InvitationAccept
)

router = APIRouter()


def check_project_access(
    project_id: int,
    db: Session,
    current_user: User,
    required_role: str = "member"
) -> Project:
    """Check if user has access to project with required role."""
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user is project owner
    if project.owner_id == current_user.id:
        return project
    
    # Check if user is a member with required role
    membership = db.query(ProjectMember).filter(
        and_(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check role hierarchy (admin > member)
    if required_role == "admin" and membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return project


@router.get("/projects/{project_id}/members", response_model=List[TeamMemberResponse])
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all members of a project."""
    project = check_project_access(project_id, db, current_user)
    
    # Get all members with their profiles
    members = []
    
    # Add project owner
    owner_profile = db.query(Profile).filter(Profile.id == project.owner_id).first()
    members.append(TeamMemberResponse(
        id=project.owner_id,
        email=owner_profile.email if owner_profile else "unknown@email.com",
        full_name=owner_profile.full_name if owner_profile else "Project Owner",
        avatar_url=owner_profile.avatar_url if owner_profile else None,
        role="owner",
        joined_at=project.created_at
    ))
    
    # Add other members
    project_members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()
    
    for pm in project_members:
        profile = db.query(Profile).filter(Profile.id == pm.user_id).first()
        members.append(TeamMemberResponse(
            id=pm.user_id,
            email=profile.email if profile else "unknown@email.com",
            full_name=profile.full_name if profile else "Team Member",
            avatar_url=profile.avatar_url if profile else None,
            role=pm.role,
            joined_at=pm.joined_at
        ))
    
    return members


@router.post("/projects/{project_id}/invitations", response_model=InvitationResponse)
def invite_member(
    project_id: int,
    invitation: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Send invitation to join a project."""
    # Check if current user has admin access
    project = check_project_access(project_id, db, current_user, required_role="admin")
    
    # Check if user exists
    invitee_profile = db.query(Profile).filter(Profile.email == invitation.email).first()
    invitee_id = invitee_profile.id if invitee_profile else None
    
    # Check if already a member
    if invitee_id:
        existing_member = db.query(ProjectMember).filter(
            and_(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == invitee_id
            )
        ).first()
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this project"
            )
    
    # Check for existing pending invitation
    existing_invitation = db.query(ProjectInvitation).filter(
        and_(
            ProjectInvitation.project_id == project_id,
            ProjectInvitation.email == invitation.email,
            ProjectInvitation.status == "pending"
        )
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pending invitation already exists for this email"
        )
    
    # Create invitation
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    db_invitation = ProjectInvitation(
        project_id=project_id,
        email=invitation.email,
        role=invitation.role,
        invited_by=current_user.id,
        token=invitation_token,
        expires_at=expires_at,
        status="pending"
    )
    
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    
    return InvitationResponse(
        id=db_invitation.id,
        project_id=db_invitation.project_id,
        project_name=project.name,
        email=db_invitation.email,
        role=db_invitation.role,
        status=db_invitation.status,
        token=db_invitation.token,
        invited_by=current_user.id,
        inviter_name=current_user.email,
        expires_at=db_invitation.expires_at,
        created_at=db_invitation.created_at
    )


@router.get("/invitations/by-token/{token}", response_model=InvitationResponse)
def get_invitation_by_token(
    token: str,
    db: Session = Depends(get_db)
) -> Any:
    """Get invitation details by token (no auth required)."""
    invitation = db.query(ProjectInvitation).filter(
        ProjectInvitation.token == token
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation has already been {invitation.status}"
        )
    
    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Get project and inviter details
    project = db.query(Project).filter(Project.id == invitation.project_id).first()
    inviter = db.query(Profile).filter(Profile.id == invitation.invited_by).first()
    
    return InvitationResponse(
        id=invitation.id,
        project_id=invitation.project_id,
        project_name=project.name if project else "Unknown Project",
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        token=invitation.token,
        invited_by=invitation.invited_by,
        inviter_name=inviter.full_name if inviter else "Unknown",
        expires_at=invitation.expires_at,
        created_at=invitation.created_at
    )


@router.post("/invitations/{invitation_id}/accept")
def accept_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Accept a project invitation."""
    invitation = db.query(ProjectInvitation).filter(
        ProjectInvitation.id == invitation_id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if user's email matches invitation
    user_profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if user_profile.email != invitation.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is for a different email address"
        )
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation has already been {invitation.status}"
        )
    
    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Check if already a member
    existing_member = db.query(ProjectMember).filter(
        and_(
            ProjectMember.project_id == invitation.project_id,
            ProjectMember.user_id == current_user.id
        )
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this project"
        )
    
    # Add user as project member
    new_member = ProjectMember(
        project_id=invitation.project_id,
        user_id=current_user.id,
        role=invitation.role
    )
    db.add(new_member)
    
    # Update invitation status
    invitation.status = "accepted"
    invitation.responded_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Invitation accepted successfully"}


@router.post("/invitations/{invitation_id}/decline")
def decline_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Decline a project invitation."""
    invitation = db.query(ProjectInvitation).filter(
        ProjectInvitation.id == invitation_id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if user's email matches invitation
    user_profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if user_profile.email != invitation.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is for a different email address"
        )
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation has already been {invitation.status}"
        )
    
    # Update invitation status
    invitation.status = "declined"
    invitation.responded_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Invitation declined"}


@router.delete("/projects/{project_id}/members/{user_id}")
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Remove a member from a project."""
    # Check if current user has admin access
    project = check_project_access(project_id, db, current_user, required_role="admin")
    
    # Cannot remove project owner
    if user_id == project.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove project owner"
        )
    
    # Get membership
    membership = db.query(ProjectMember).filter(
        and_(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this project"
        )
    
    db.delete(membership)
    db.commit()
    
    return {"message": "Member removed successfully"}

