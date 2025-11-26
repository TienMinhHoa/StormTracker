"""
LangGraph Agent for Storm Tracker Chatbot
Uses Gemini as LLM and integrates RAG + Rescue Request tools
"""
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
from src.config import config
from src.chatbot.tools import CHATBOT_TOOLS
from src.logger import logger
import asyncio


# Define the state for our agent
class AgentState(TypedDict):
    """State of the chatbot agent"""
    messages: Annotated[Sequence[BaseMessage], add_messages]


class StormChatbotAgent:
    """
    Chatbot Agent for Storm Tracker
    - Answers questions about storms, preparation, first aid, rescue
    - Can create rescue requests when needed
    """
    
    def __init__(self):
        """Initialize the chatbot agent with LangGraph"""
        # Initialize Gemini LLM with tools
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=config.GOOGLE_API_KEY,
            temperature=0.7,
            max_tokens=2048,
        )
        
        # Bind tools to LLM
        self.llm_with_tools = self.llm.bind_tools(CHATBOT_TOOLS)
        
        # Create the graph
        self.graph = self._create_graph()
    
    def _create_graph(self) -> StateGraph:
        """Create the LangGraph workflow"""
        # Define workflow
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode(CHATBOT_TOOLS))
        
        # Set entry point
        workflow.set_entry_point("agent")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "continue": "tools",
                "end": END
            }
        )
        
        # Add edge from tools back to agent
        workflow.add_edge("tools", "agent")
        
        # Compile the graph
        return workflow.compile()
    
    async def _call_model(self, state: AgentState) -> AgentState:
        """Call the LLM with current state"""
        messages = state["messages"]
        
        # Add system message for context
        system_message = """Bạn là trợ lý AI thông minh của hệ thống Storm Tracker, chuyên hỗ trợ người dân về các vấn đề liên quan đến bão.

NHIỆM VỤ CỦA BẠN:
1. Trả lời câu hỏi về bão, cách phòng tránh, chuẩn bị đón bão
2. Cung cấp kiến thức sơ cứu và cứu hộ
3. Tạo yêu cầu cứu hộ khẩn cấp khi người dùng cần giúp đỡ

CÔNG CỤ BẠN CÓ:
- search_storm_knowledge: Tìm kiếm thông tin trong cơ sở kiến thức về bão
- create_rescue_request: Tạo yêu cầu cứu hộ khẩn cấp

HƯỚNG DẪN:
- Luôn thân thiện, lịch sự và đồng cảm
- Khi người dùng hỏi về kiến thức, hãy dùng tool search_storm_knowledge
- Khi người dùng cần cứu hộ, hãy thu thập đầy đủ thông tin (tên, số điện thoại, địa chỉ, tình trạng) rồi dùng create_rescue_request
- Ưu tiên an toàn của người dân lên hàng đầu
- Trả lời ngắn gọn, dễ hiểu, rõ ràng
- Nếu không chắc chắn, hãy thừa nhận và đề nghị người dùng liên hệ đường dây nóng khẩn cấp"""
        
        # Prepare messages with system context
        all_messages = [HumanMessage(content=system_message)] + list(messages)
        
        # Call LLM asynchronously
        response = await asyncio.to_thread(self.llm_with_tools.invoke, all_messages)
        
        return {"messages": [response]}
    
    def _should_continue(self, state: AgentState) -> str:
        """Determine if we should continue to tools or end"""
        messages = state["messages"]
        last_message = messages[-1]
        logger.debug(f"Last message type: {type(last_message)}")
        # If there are tool calls, continue to tools node
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            logger.debug("Continuing to tools node")
            logger.debug(f"Tool calls: {last_message.tool_calls}")
            return "continue"
        
        # Otherwise, end
        return "end"
    
    async def chat(self, message: str, conversation_history: list = None) -> dict:
        """
        Process a chat message and return response
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            
        Returns:
            Dictionary with response and updated history
        """
        # Prepare initial state
        messages = conversation_history or []
        messages.append(HumanMessage(content=message))
        
        initial_state = {"messages": messages}
        
        # Run the graph
        result = await self.graph.ainvoke(initial_state)
        
        # Get the final response
        final_messages = result["messages"]
        last_message = final_messages[-1]
        
        # Extract response content
        if isinstance(last_message, AIMessage):
            response_text = last_message.content
        else:
            response_text = str(last_message)
        
        return {
            "response": response_text,
            "conversation_history": final_messages
        }


# Create singleton instance
chatbot_agent = StormChatbotAgent()
