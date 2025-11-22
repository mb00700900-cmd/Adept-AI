"""
AI API endpoints using Grok (xAI).
Handles AI-powered task generation using Grok API.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from openai import OpenAI

from app.dependencies import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter()

# Configure Grok client
client = OpenAI(
    api_key=settings.GROK_API_KEY,
    base_url="https://api.x.ai/v1"
)


class TaskDecomposeRequest(BaseModel):
    """Request schema for AI task decomposition."""
    projectDescription: str = Field(..., min_length=10, max_length=2000)


class AISuggestion(BaseModel):
    """AI-generated task suggestion."""
    suggestion_id: str
    title: str
    description: str
    priority: str  # 'low', 'medium', 'high'
    priority_reasoning: str | None = None
    effort_estimate: int
    effort_confidence: str | None = None
    effort_reasoning: str | None = None
    is_editable: bool = True
    source: str = "grok"


class TaskDecomposeResponse(BaseModel):
    """Response schema for AI task decomposition."""
    suggestions: List[AISuggestion]


@router.post("/task-decompose", response_model=TaskDecomposeResponse)
async def decompose_project_to_tasks(
    request: TaskDecomposeRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Use AI to break down a project description into actionable tasks.
    Powered by Grok AI (xAI).
    """
    try:
        # Create detailed prompt for task generation
        prompt = f"""You are a project management AI assistant. Break down the following project into 5-8 actionable tasks.

Project Description:
{request.projectDescription}

For each task, provide:
1. A clear, actionable title (max 100 chars)
2. A detailed description (2-3 sentences)
3. Priority level (low/medium/high) with reasoning
4. Effort estimate in hours (realistic estimate)
5. Confidence level for the estimate (low/medium/high)
6. Reasoning for the effort estimate

Format your response as a JSON array with this structure:
[
  {{
    "title": "Task title",
    "description": "Detailed description",
    "priority": "high",
    "priority_reasoning": "Why this priority",
    "effort_estimate": 8,
    "effort_confidence": "medium",
    "effort_reasoning": "Why this estimate"
  }}
]

Be specific and practical. Focus on deliverable milestones. Return ONLY the JSON array, no additional text."""
        
        # Call Grok API
        completion = client.chat.completions.create(
            model="grok-2-1212",  # Latest Grok model
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful project management assistant that breaks down projects into actionable tasks. Always respond with valid JSON arrays."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        # Parse JSON
        import json
        import uuid
        
        try:
            tasks_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback: try to find JSON array in the text
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                tasks_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse AI response as JSON")
        
        # Convert to AISuggestion objects
        suggestions = []
        for idx, task in enumerate(tasks_data):
            suggestion = AISuggestion(
                suggestion_id=f"grok-{uuid.uuid4()}",
                title=task.get("title", f"Task {idx + 1}"),
                description=task.get("description", ""),
                priority=task.get("priority", "medium").lower(),
                priority_reasoning=task.get("priority_reasoning"),
                effort_estimate=int(task.get("effort_estimate", 4)),
                effort_confidence=task.get("effort_confidence"),
                effort_reasoning=task.get("effort_reasoning"),
                is_editable=True,
                source="grok"
            )
            suggestions.append(suggestion)
        
        return TaskDecomposeResponse(suggestions=suggestions)
    
    except Exception as e:
        # Log the error and return a user-friendly message
        print(f"Grok AI Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI suggestions: {str(e)}"
        )

