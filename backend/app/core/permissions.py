"""
Role-based access control (RBAC) utilities.
Implements permission checking for project resources.
"""

from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project_member import ProjectMember, ProjectRole
from app.models.user import User


# Role hierarchy: higher value = more permissions
ROLE_HIERARCHY = {
    ProjectRole.VIEWER: 1,
    ProjectRole.EDITOR: 2,
    ProjectRole.OWNER: 3,
}


def check_project_access(
    db: Session,
    user: User,
    project_id: UUID
) -> Optional[ProjectMember]:
    """
    Check if user has any access to a project.
    
    Args:
        db: Database session
        user: Current user
        project_id: Project UUID
        
    Returns:
        ProjectMember if user has access, None otherwise
    """
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id
    ).first()
    
    return membership


def check_project_role(
    db: Session,
    user: User,
    project_id: UUID
) -> Optional[ProjectRole]:
    """
    Get user's role in a project.
    
    Args:
        db: Database session
        user: Current user
        project_id: Project UUID
        
    Returns:
        ProjectRole if user is a member, None otherwise
    """
    membership = check_project_access(db, user, project_id)
    return membership.role if membership else None


def require_project_role(
    db: Session,
    user: User,
    project_id: UUID,
    required_role: ProjectRole = ProjectRole.VIEWER
) -> ProjectMember:
    """
    Require user to have at least a certain role in a project.
    Raises HTTPException if user doesn't have sufficient permissions.
    
    Args:
        db: Database session
        user: Current user
        project_id: Project UUID
        required_role: Minimum required role (default: VIEWER)
        
    Returns:
        ProjectMember: User's membership if authorized
        
    Raises:
        HTTPException: 403 if user doesn't have sufficient permissions
        HTTPException: 404 if user is not a project member
        
    Example:
        # Require at least Editor role
        membership = require_project_role(db, current_user, project_id, ProjectRole.EDITOR)
        
        # Require Owner role
        membership = require_project_role(db, current_user, project_id, ProjectRole.OWNER)
    """
    membership = check_project_access(db, user, project_id)
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    
    # Check if user's role is sufficient
    if ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[required_role]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required role: {required_role.value}"
        )
    
    return membership


def is_project_owner(db: Session, user: User, project_id: UUID) -> bool:
    """
    Check if user is project owner.
    
    Args:
        db: Database session
        user: Current user
        project_id: Project UUID
        
    Returns:
        bool: True if user is owner, False otherwise
    """
    role = check_project_role(db, user, project_id)
    return role == ProjectRole.OWNER if role else False


def can_edit_tasks(db: Session, user: User, project_id: UUID) -> bool:
    """
    Check if user can create/edit/delete tasks.
    
    Args:
        db: Database session
        user: Current user
        project_id: Project UUID
        
    Returns:
        bool: True if user is Editor or Owner, False otherwise
    """
    role = check_project_role(db, user, project_id)
    if not role:
        return False
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[ProjectRole.EDITOR]


def can_manage_team(db: Session, user: User, project_id: UUID) -> bool:
    """
    Check if user can manage team members.
    
    Args:
        db: Database session
        user: Current user
        project_id: Project UUID
        
    Returns:
        bool: True if user is Owner, False otherwise
    """
    return is_project_owner(db, user, project_id)

