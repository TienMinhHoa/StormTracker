"""
Service layer for Chatbot
"""
from typing import Dict, List, Any
from src.chatbot.agent import chatbot_agent
from src.chatbot.tools import rag_system
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage


class ChatbotService:
    """Service for handling chatbot logic"""
    
    def __init__(self):
        self.agent = chatbot_agent
        self.rag = rag_system
    
    async def process_message(
        self,
        message: str,
        conversation_history: List[Dict[str, Any]] = None,
        storm_id: str = None
    ) -> Dict[str, Any]:
        """
        Process user message and return chatbot response
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            storm_id: Current storm ID for context
            
        Returns:
            Dictionary with response and updated history
        """
        # Convert conversation history to LangChain messages
        langchain_history = []
        if conversation_history:
            for msg in conversation_history:
                msg_type = msg.get("type", "")
                content = msg.get("content", "")
                
                if msg_type == "human":
                    langchain_history.append(HumanMessage(content=content))
                elif msg_type == "ai":
                    langchain_history.append(AIMessage(content=content))
                elif msg_type == "tool":
                    langchain_history.append(ToolMessage(
                        content=content,
                        tool_call_id=msg.get("tool_call_id", "")
                    ))
        
        # Add storm_id to message context if provided
        if storm_id:
            message = f"[Storm ID: {storm_id}] {message}"
        
        # Process through agent
        result = await self.agent.chat(message, langchain_history)
        
        # Convert back to serializable format
        serializable_history = []
        for msg in result["conversation_history"]:
            if isinstance(msg, HumanMessage):
                serializable_history.append({
                    "type": "human",
                    "content": msg.content
                })
            elif isinstance(msg, AIMessage):
                serializable_history.append({
                    "type": "ai",
                    "content": msg.content,
                    "tool_calls": getattr(msg, "tool_calls", [])
                })
            elif isinstance(msg, ToolMessage):
                serializable_history.append({
                    "type": "tool",
                    "content": msg.content,
                    "tool_call_id": msg.tool_call_id
                })
        
        return {
            "response": result["response"],
            "conversation_history": serializable_history
        }
    
    def check_health(self) -> Dict[str, Any]:
        """
        Check health of chatbot components
        
        Returns:
            Health status dictionary
        """
        try:
            # Try to connect to Qdrant
            collections = self.rag.client.get_collections()
            qdrant_connected = True
        except Exception as e:
            qdrant_connected = False
        
        return {
            "status": "healthy" if qdrant_connected else "degraded",
            "qdrant_connected": qdrant_connected,
            "message": "Chatbot service is operational" if qdrant_connected 
                      else "Qdrant connection failed - RAG features may not work"
        }


# Singleton instance
chatbot_service = ChatbotService()
