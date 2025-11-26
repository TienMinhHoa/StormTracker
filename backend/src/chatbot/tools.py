"""
Chatbot Tools for Storm Tracker
Includes RAG tool for knowledge base and Rescue Request tool
"""
from typing import Optional, Dict, Any
from langchain_core.tools import tool, StructuredTool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from src.config import config
from src.logger import logger
from pydantic import BaseModel, Field
import json
import asyncio


class StormKnowledgeRAG:
    """RAG tool for storm-related knowledge base using Qdrant"""
    
    def __init__(self, qdrant_url: str = None, qdrant_port: int = None):
        """
        Initialize RAG system with Qdrant
        
        Args:
            qdrant_url: Qdrant server URL (defaults to config.QDRANT_URL)
            qdrant_port: Qdrant server port (defaults to config.QDRANT_PORT)
        """
        logger.debug("Initializing StormKnowledgeRAG")
        qdrant_url = qdrant_url or config.QDRANT_URL
        qdrant_api_key = config.QDRANT_API_KEY
        self.client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=config.GOOGLE_API_KEY,
            task_type="retrieval_document"
        )
        self.collection_name = "storm_knowledge"
        
        # Create collection if not exists
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
    
    async def handle_search(self, query: str, top_k: int = 3) -> str:
        """
        Search knowledge base for relevant information
        
        Args:
            query: User's question
            top_k: Number of top results to return
            
        Returns:
            Formatted string with relevant knowledge
        """
        # Generate embedding for query (run in executor to avoid blocking)
        logger.info(f"Performing RAG search for query: {query}")
        loop = asyncio.get_event_loop()
        query_vector = await loop.run_in_executor(None, self.embeddings.embed_query, query)
        
        search_results = await loop.run_in_executor(
            None,
            lambda: self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=top_k
            ).points
        )

        
        if not search_results:
            return "Không tìm thấy thông tin liên quan trong cơ sở dữ liệu kiến thức."
        
        # Format results
        knowledge_text = "Thông tin từ cơ sở kiến thức:\n\n"
        for idx, result in enumerate(search_results, 1):
            payload = result.payload
            knowledge_text += f"{idx}. {payload.get('title', 'Không có tiêu đề')}\n"
            knowledge_text += f"   {payload.get('content', '')}\n"
            knowledge_text += f"   (Độ liên quan: {result.score:.2f})\n\n"
        logger.info(f"RAG Search Query: {query} | Results Found: {len(search_results)}")
        return knowledge_text


# Initialize RAG system
rag_system = StormKnowledgeRAG()


async def search_storm_knowledge(query: str) -> str:
    """
    Tìm kiếm thông tin về bão, cách phòng tránh, chuẩn bị đón bão, kiến thức sơ cứu và cứu hộ.
    
    Args:
        query: Câu hỏi hoặc từ khóa tìm kiếm về kiến thức bão
        
    Returns:
        Thông tin liên quan từ cơ sở kiến thức
        
    Examples:
        - "Cách chuẩn bị khi bão đến"
        - "Kỹ năng sơ cứu khi bị thương trong bão"
        - "Những vật dụng cần thiết khi có bão"
    """
    return await rag_system.handle_search(query)


async def create_rescue_request(
    storm_id: str,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    priority: Optional[int] = 3,
    note: Optional[str] = None
) -> str:
    """
    Tạo yêu cầu cứu hộ khẩn cấp cho người dân gặp nạn trong bão.
    
    Args:
        storm_id: Mã số cơn bão (bắt buộc)
        name: Tên người cần cứu hộ
        phone: Số điện thoại liên lạc
        address: Địa chỉ cụ thể
        lat: Vĩ độ (latitude)
        lon: Kinh độ (longitude)
        priority: Mức độ ưu tiên (1=cao nhất, 5=thấp nhất, mặc định=3)
        note: Ghi chú thêm về tình huống
        
    Returns:
        Thông báo xác nhận yêu cầu đã được tạo
        
    Examples:
        - Tạo yêu cầu: storm_id="STORM001", name="Nguyễn Văn A", phone="0123456789", 
          address="123 Đường ABC", priority=1, note="Nhà bị ngập nặng, có người già"
    """
    # Import here to avoid circular dependency
    from src.rescue.model import rescue_requests
    from src.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        try:
            # Create rescue request in database
            request = await rescue_requests.create_rescue_request(
                session=session,
                storm_id=storm_id,
                name=name,
                phone=phone,
                address=address,
                lat=lat,
                lon=lon,
                priority=priority,
                status="pending",
                type="emergency",
                verified=False,
                note=note
            )
            await session.commit()
            
            return f"""✅ Yêu cầu cứu hộ đã được tạo thành công!
            
Mã yêu cầu: {request.request_id}
Tên: {name or 'Chưa cung cấp'}
Số điện thoại: {phone or 'Chưa cung cấp'}
Địa chỉ: {address or 'Chưa cung cấp'}
Mức độ ưu tiên: {priority}/5
Trạng thái: Đang chờ xử lý

Lực lượng cứu hộ sẽ liên hệ sớm nhất có thể. Vui lòng giữ máy và ở nơi an toàn!"""
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating rescue request: {str(e)}")
            return f"❌ Có lỗi xảy ra khi tạo yêu cầu cứu hộ: {str(e)}. Vui lòng thử lại hoặc gọi đường dây nóng khẩn cấp."


# Define Pydantic schemas for tool inputs
class SearchKnowledgeInput(BaseModel):
    query: str = Field(description="Câu hỏi hoặc từ khóa tìm kiếm về kiến thức bão")

class CreateRescueInput(BaseModel):
    storm_id: str = Field(description="Mã số cơn bão (bắt buộc)")
    name: Optional[str] = Field(None, description="Tên người cần cứu hộ")
    phone: Optional[str] = Field(None, description="Số điện thoại liên lạc")
    address: Optional[str] = Field(None, description="Địa chỉ cụ thể")
    lat: Optional[float] = Field(None, description="Vĩ độ (latitude)")
    lon: Optional[float] = Field(None, description="Kinh độ (longitude)")
    priority: Optional[int] = Field(3, description="Mức độ ưu tiên (1=cao nhất, 5=thấp nhất)")
    note: Optional[str] = Field(None, description="Ghi chú thêm về tình huống")

# Create async tools using StructuredTool
search_storm_knowledge_tool = StructuredTool(
    name="search_storm_knowledge",
    description="Tìm kiếm thông tin về bão, cách phòng tránh, chuẩn bị đón bão, kiến thức sơ cứu và cứu hộ. Dùng khi người dùng hỏi về kiến thức liên quan đến bão.",
    args_schema=SearchKnowledgeInput,
    coroutine=search_storm_knowledge
)

create_rescue_request_tool = StructuredTool(
    name="create_rescue_request",
    description="Tạo yêu cầu cứu hộ khẩn cấp cho người dân gặp nạn trong bão. Dùng khi người dùng cần giúp đỡ khẩn cấp và đã cung cấp đủ thông tin cần thiết.",
    args_schema=CreateRescueInput,
    coroutine=create_rescue_request
)

# List of all available tools
CHATBOT_TOOLS = [
    search_storm_knowledge_tool,
    create_rescue_request_tool
]


if __name__ == "__main__":
    import asyncio

    async def test_tools():
        # Test RAG search
        query = "Cách chuẩn bị khi bão đến"
        rag_result = await search_storm_knowledge(query)
        print("RAG Search Result:")
        print(rag_result)

        # Test creating rescue request
        rescue_result = await create_rescue_request(
            storm_id="NOWLIVE1234",
            name="Nguyễn Văn A",
            phone="0123456789",
            address="123 Đường ABC",
            priority=1,
            note="Nhà bị ngập nặng, có người già"
        )

    asyncio.run(test_tools())