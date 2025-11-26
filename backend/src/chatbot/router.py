"""
FastAPI Router for Chatbot endpoints (HTTP + WebSocket)
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from typing import Dict, List, Optional
import json
from datetime import datetime
import uuid
from src.chatbot.schemas import ChatRequest, ChatResponse, HealthCheckResponse
from src.chatbot.service import chatbot_service
from src.logger import logger

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

# Store active WebSocket connections with metadata
# Key: client_id, Value: {"websocket": WebSocket, "connection_id": str, "connected_at": datetime}
active_connections: Dict[str, dict] = {}


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Check health status of chatbot service
    
    Returns:
        Health status including Qdrant connection status
    """
    try:
        health_status = chatbot_service.check_health()
        return HealthCheckResponse(**health_status)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return HealthCheckResponse(
            status="unhealthy",
            qdrant_connected=False,
            message=f"Health check failed: {str(e)}"
        )


@router.websocket("/ws")
async def websocket_chat(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None, description="Unique client identifier (browser/device ID)")
):
    """
    WebSocket endpoint for real-time chat with Storm Tracker AI assistant
    
    Connection: ws://localhost:8000/chatbot/ws?client_id=your-unique-id
    
    Message format (client -> server):
    {
        "type": "message|ping|reset|identify",
        "message": "User's message here",
        "storm_id": "STORM001",
        "client_id": "optional-override",  // Can override URL param
        "conversation_history": []  // optional
    }
    
    Response format (server -> client):
    {
        "type": "response",
        "response": "Bot's response here",
        "conversation_history": [...],
        "timestamp": "2025-11-25T10:00:00",
        "client_id": "your-client-id"
    }
    
    Error format:
    {
        "type": "error",
        "error": "Error message",
        "timestamp": "2025-11-25T10:00:00"
    }
    
    Status messages:
    {
        "type": "status",
        "status": "connected|processing|ready",
        "message": "Status message",
        "timestamp": "2025-11-25T10:00:00",
        "client_id": "your-client-id",
        "connection_id": "ip:port"
    }
    """
    # Accept connection
    await websocket.accept()
    
    # Generate or use provided client_id
    if not client_id:
        client_id = str(uuid.uuid4())
    
    # Generate connection ID (for internal tracking)
    connection_id = f"{websocket.client.host}:{websocket.client.port}"
    
    # Store connection with metadata
    active_connections[client_id] = {
        "websocket": websocket,
        "connection_id": connection_id,
        "connected_at": datetime.now(),
        "client_host": websocket.client.host
    }
    
    # Send welcome message
    await websocket.send_json({
        "type": "status",
        "status": "connected",
        "message": "Connected to Storm Tracker AI assistant. Send your message!",
        "timestamp": datetime.now().isoformat(),
        "client_id": client_id,
        "connection_id": connection_id
    })
    
    logger.info(f"WebSocket client connected: client_id={client_id}, connection={connection_id}")
    
    # Store conversation history for this connection
    conversation_history = []
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                # Parse JSON message
                message_data = json.loads(data)
                message_type = message_data.get("type", "message")
                
                # Allow client to update their ID
                new_client_id = message_data.get("client_id")
                if new_client_id and new_client_id != client_id:
                    # Move connection to new client_id
                    if client_id in active_connections:
                        active_connections[new_client_id] = active_connections.pop(client_id)
                    client_id = new_client_id
                    logger.info(f"Client ID updated to: {client_id}")
                
                if message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat(),
                        "client_id": client_id
                    })
                    continue
                
                if message_type == "reset":
                    # Reset conversation history
                    conversation_history = []
                    await websocket.send_json({
                        "type": "status",
                        "status": "ready",
                        "message": "Conversation history has been reset",
                        "timestamp": datetime.now().isoformat(),
                        "client_id": client_id
                    })
                    continue
                
                if message_type == "identify":
                    # Client identifying itself
                    await websocket.send_json({
                        "type": "status",
                        "status": "identified",
                        "message": f"Client identified as {client_id}",
                        "timestamp": datetime.now().isoformat(),
                        "client_id": client_id,
                        "connection_id": connection_id
                    })
                    continue
                
                # Extract message details
                user_message = message_data.get("message", "")
                storm_id = message_data.get("storm_id")
                history = message_data.get("conversation_history", conversation_history)
                
                if not user_message:
                    await websocket.send_json({
                        "type": "error",
                        "error": "Message cannot be empty",
                        "timestamp": datetime.now().isoformat(),
                        "client_id": client_id
                    })
                    continue
                
                logger.info(f"WebSocket message from client_id={client_id}: {user_message[:50]}...")
                
                # Send processing status
                await websocket.send_json({
                    "type": "status",
                    "status": "processing",
                    "message": "Processing your message...",
                    "timestamp": datetime.now().isoformat(),
                    "client_id": client_id
                })
                
                # Process message through chatbot service
                result = await chatbot_service.process_message(
                    message=user_message,
                    conversation_history=history,
                    storm_id=storm_id
                )
                
                # Update conversation history
                conversation_history = result["conversation_history"]
                
                # Send response
                await websocket.send_json({
                    "type": "response",
                    "response": result["response"],
                    "conversation_history": result["conversation_history"],
                    "timestamp": datetime.now().isoformat(),
                    "client_id": client_id
                })
                
                logger.info(f"WebSocket response sent to client_id={client_id}")
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "error": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat(),
                    "client_id": client_id
                })
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {str(e)}", exc_info=True)
                await websocket.send_json({
                    "type": "error",
                    "error": f"Error processing message: {str(e)}",
                    "timestamp": datetime.now().isoformat(),
                    "client_id": client_id
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: client_id={client_id}, connection={connection_id}")
        if client_id in active_connections:
            del active_connections[client_id]
    
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        if client_id in active_connections:
            del active_connections[client_id]


@router.get("/ws/connections")
async def get_active_connections():
    """
    Get number of active WebSocket connections with client details
    
    Returns:
        Number of active connections and their metadata
    """
    connections_info = []
    for client_id, conn_data in active_connections.items():
        connections_info.append({
            "client_id": client_id,
            "connection_id": conn_data["connection_id"],
            "client_host": conn_data["client_host"],
            "connected_at": conn_data["connected_at"].isoformat(),
            "duration_seconds": (datetime.now() - conn_data["connected_at"]).total_seconds()
        })
    
    return {
        "active_connections": len(active_connections),
        "connections": connections_info
    }
