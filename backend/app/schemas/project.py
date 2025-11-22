"""Project schemas."""
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

