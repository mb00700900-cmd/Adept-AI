"""Analytics schemas."""
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date

class KPIMetrics(BaseModel):
    total_projects: int
    projects_trend: float
    total_tasks: int
    completion_rate: float
    avg_project_duration: float
    ai_accuracy: float

class KPIResponse(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    completion_rate: float
    avg_completion_time: Optional[float]

class TaskTrendData(BaseModel):
    date: str
    created: int
    completed: int

class TaskTrendResponse(BaseModel):
    date: date
    created: int
    completed: int

class DistributionData(BaseModel):
    name: str
    value: int

class PriorityDistributionResponse(BaseModel):
    priority: str
    count: int

class StatusDistributionResponse(BaseModel):
    status: str
    count: int

