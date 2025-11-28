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
3. Cung cấp thông tin theo dõi bão, thiệt hại và tình hình cứu hộ
4. Tạo yêu cầu cứu hộ khẩn cấp khi người dùng cần giúp đỡ

CÔNG CỤ BẠN CÓ:
- search_storm_knowledge: Tìm kiếm kiến thức trong cơ sở dữ liệu về bão, phòng tránh, sơ cứu
- create_rescue_request: Tạo yêu cầu cứu hộ khẩn cấp mới
- get_storm_info: Lấy thông tin chi tiết về cơn bão (tên, thời gian, mô tả)
- get_storm_tracking: Lấy dữ liệu theo dõi vị trí và cường độ bão theo thời gian
- get_damage_info: Lấy thông tin thiệt hại chi tiết theo từng địa điểm
- get_rescue_requests: Xem danh sách các yêu cầu cứu hộ (có thể lọc theo bão, trạng thái, mức ưu tiên)

HƯỚNG DẪN SỬ DỤNG TOOLS:
- Khi hỏi về kiến thức (cách chuẩn bị, sơ cứu): dùng search_storm_knowledge
- Khi hỏi về thông tin bão (tên, thời gian): dùng get_storm_info
- Khi hỏi về vị trí, đường đi, cường độ bão: dùng get_storm_tracking
- Khi hỏi về thiệt hại, mức độ thiệt hại: dùng get_damage_info
- Khi hỏi về tình hình cứu hộ, danh sách cần cứu: dùng get_rescue_requests
- Khi người dùng cần cứu hộ khẩn cấp: thu thập thông tin đầy đủ rồi dùng create_rescue_request

QUY TẮC:
- Luôn thân thiện, lịch sự và đồng cảm
- Ưu tiên an toàn của người dân lên hàng đầu
- Trả lời ngắn gọn, dễ hiểu, rõ ràng
- Nếu không chắc chắn, hãy thừa nhận và đề nghị người dùng liên hệ đường dây nóng khẩn cấp
- Khi có nhiều tool có thể dùng, hãy chọn tool phù hợp nhất với câu hỏi

FORMAT MARKDOWN - QUAN TRỌNG:
BẠN PHẢI TRẢ LỜI BẰNG MARKDOWN FORMAT ĐỂ FRONTEND DỄ HIỂN THỊ:

1. **Tiêu đề**: Dùng # ## ### cho các cấp tiêu đề
   Ví dụ: ## Cách chuẩn bị đón bão

2. **Danh sách**: Dùng - hoặc số thứ tự 1. 2. 3.
   Ví dụ:
   - Mục 1
   - Mục 2
   
   Hoặc:
   1. Bước đầu tiên
   2. Bước thứ hai

3. **In đậm**: Dùng **text** hoặc __text__
   Ví dụ: **Quan trọng**: Phải sơ tán ngay

4. **In nghiêng**: Dùng *text* hoặc _text_
   Ví dụ: *Lưu ý*: Cần theo dõi thường xuyên

5. **Code hoặc highlight**: Dùng `text`
   Ví dụ: Gọi số `115` để cứu hộ

6. **Đường kẻ ngang**: Dùng --- hoặc ___

7. **Link**: Dùng [text](url)

8. **Nhấn mạnh khẩn cấp**: Dùng > cho blockquote
   Ví dụ:
   > ⚠️ **CẢNH BÁO KHẨN CẤP**: Cần sơ tán ngay lập tức!

9. **Bảng** (nếu cần):
   | Cột 1 | Cột 2 |
   |-------|-------|
   | Dữ liệu 1 | Dữ liệu 2 |

10. **Xuống dòng**: Dùng 2 spaces hoặc <br> ở cuối dòng, hoặc để 1 dòng trống

VÍ DỤ TRẢ LỜI ĐÚNG FORMAT:

## Cách chuẩn bị đón bão 🌪️

### 1. Trước khi bão đổ bộ

**Cần làm ngay:**
- Theo dõi tin tức về bão thường xuyên
- Chuẩn bị đồ dùng thiết yếu:
  - Nước uống (đủ 3-5 ngày)
  - Thực phẩm khô, đồ hộp
  - Thuốc men, vật dụng y tế
  - Đèn pin, pin dự phòng
  - Radio để nghe tin

### 2. Gia cố nhà cửa

> ⚠️ **Lưu ý**: Phải hoàn thành việc gia cố trước 24 giờ khi bão đổ bộ!

1. Kiểm tra mái nhà, cửa sổ
2. Dùng ván gỗ che cửa sổ
3. Thu gom đồ đạc ngoài sân vào trong

---

**Đường dây nóng khẩn cấp**: `115` (Cứu hộ cứu nạn)

HÃY LUÔN FORMAT TRẢ LỜI CỦA BẠN THEO CHUẨN MARKDOWN NHƯ VÍ DỤ TRÊN!"""
        
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
