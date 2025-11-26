"""
Pydantic schemas for Chatbot API
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)


class ChatRequest(BaseModel):
    """Request for chat endpoint"""
    message: str = Field(..., description="User's message", min_length=1)
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Previous conversation history"
    )
    storm_id: Optional[str] = Field(
        default=None,
        description="Storm ID for context (required for rescue requests)"
    )


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    response: str = Field(..., description="Chatbot's response")
    conversation_history: List[Dict[str, Any]] = Field(
        ...,
        description="Updated conversation history"
    )
    timestamp: datetime = Field(default_factory=datetime.now)


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    qdrant_connected: bool
    message: str
