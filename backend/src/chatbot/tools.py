"""
Chatbot Tools for Storm Tracker
Includes RAG tool for knowledge base, Rescue Request tool, and Database Query tools
"""
from typing import Optional, Dict, Any, List
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


async def get_storm_info(storm_id: Optional[str] = None) -> str:
    """
    Lấy thông tin về cơn bão hoặc danh sách tất cả các cơn bão trong hệ thống.
    
    Args:
        storm_id: Mã số cơn bão cần tra cứu (để trống để lấy danh sách tất cả)
        
    Returns:
        Thông tin chi tiết về cơn bão hoặc danh sách các cơn bão
        
    Examples:
        - Lấy thông tin cơn bão cụ thể: storm_id="STORM001"
        - Lấy danh sách tất cả: không truyền storm_id
    """
    from src.storms.model import storms
    from src.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        try:
            if storm_id:
                # Get specific storm
                storm = await storms.get_storm_by_id(session, storm_id)
                if not storm:
                    return f"❌ Không tìm thấy cơn bão có mã {storm_id}"
                
                return f"""📊 Thông tin cơn bão {storm.storm_id}:
                
Tên: {storm.name}
Thời gian bắt đầu: {storm.start_date.strftime('%d-%m-%Y %H:%M') if storm.start_date else 'N/A'}
Thời gian kết thúc: {storm.end_date.strftime('%d-%m-%Y %H:%M') if storm.end_date else 'Đang diễn ra'}
Mô tả: {storm.description or 'Không có'}"""
            else:
                # Get all storms
                all_storms = await storms.get_all_storms(session, skip=0, limit=20)
                if not all_storms:
                    return "❌ Chưa có cơn bão nào trong hệ thống"
                
                result = "📋 Danh sách các cơn bão:\n\n"
                for storm in all_storms:
                    status = "Đang diễn ra" if not storm.end_date else "Đã kết thúc"
                    result += f"• {storm.storm_id} - {storm.name} ({status})\n"
                    result += f"  Bắt đầu: {storm.start_date.strftime('%d-%m-%Y') if storm.start_date else 'N/A'}\n"
                
                return result
        except Exception as e:
            logger.error(f"Error getting storm info: {str(e)}")
            return f"❌ Có lỗi xảy ra khi lấy thông tin bão: {str(e)}"


async def get_storm_tracking(storm_id: str, limit: int = 10) -> str:
    """
    Lấy thông tin theo dõi vị trí và cường độ của cơn bão.
    
    Args:
        storm_id: Mã số cơn bão
        limit: Số lượng điểm tracking gần nhất (mặc định 10)
        
    Returns:
        Danh sách các điểm tracking của cơn bão
        
    Examples:
        - Lấy 10 điểm gần nhất: storm_id="STORM001"
        - Lấy 20 điểm: storm_id="STORM001", limit=20
    """
    from src.storms.model import storm_tracks
    from src.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as session:
        try:
            tracks = await storm_tracks.get_tracks_by_storm(session, storm_id, skip=0, limit=limit)
            
            if not tracks:
                return f"❌ Không tìm thấy dữ liệu tracking cho cơn bão {storm_id}"
            
            result = f"📍 Tracking cơn bão {storm_id} ({len(tracks)} điểm gần nhất):\n\n"
            
            for idx, track in enumerate(tracks, 1):
                result += f"{idx}. Thời gian: {track.timestamp.strftime('%d-%m-%Y %H:%M')}\n"
                result += f"   Vị trí: {track.lat}°N, {track.lon}°E\n"
                result += f"   Cấp độ: {track.category or 'N/A'}\n"
                result += f"   Tốc độ gió: {track.wind_speed or 'N/A'} km/h\n\n"
            
            return result
        except Exception as e:
            logger.error(f"Error getting storm tracking: {str(e)}")
            return f"❌ Có lỗi xảy ra khi lấy dữ liệu tracking: {str(e)}"


async def get_damage_info(storm_id: str, limit: int = 100) -> str:
    """
    Lấy tổng hợp thông tin thiệt hại do cơn bão gây ra, bao gồm thống kê tổng quan.
    
    Args:
        storm_id: Mã số cơn bão
        limit: Số lượng báo cáo thiệt hại tối đa (mặc định 100)
        
    Returns:
        Thống kê tổng quan về thiệt hại
        
    Examples:
        - Xem thiệt hại của bão: storm_id="STORM001"
    """
    from src.damage_details.model import damage_details
    from src.database import AsyncSessionLocal
    import aiohttp
    
    async def reverse_geocode(lat: float, lon: float) -> str:
        """Convert coordinates to address using Nominatim"""
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": lat,
                "lon": lon,
                "format": "json",
                "addressdetails": 1,
                "accept-language": "vi"
            }
            headers = {"User-Agent": "StormTracker/1.0"}
            
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        address = data.get("address", {})
                        # Build readable address
                        parts = []
                        if address.get("city"):
                            parts.append(address["city"])
                        elif address.get("town"):
                            parts.append(address["town"])
                        elif address.get("village"):
                            parts.append(address["village"])
                        
                        if address.get("state"):
                            parts.append(address["state"])
                        elif address.get("province"):
                            parts.append(address["province"])
                        
                        return ", ".join(parts) if parts else f"{lat:.4f}°N, {lon:.4f}°E"
        except:
            pass
        return f"{lat:.4f}°N, {lon:.4f}°E"
    
    async with AsyncSessionLocal() as session:
        try:
            damages = await damage_details.get_damage_details_by_storm(session, storm_id, skip=0, limit=limit)
            
            if not damages:
                return f"❌ Chưa có thông tin thiệt hại cho cơn bão {storm_id}"
            
            # Calculate statistics
            total_locations = len(damages)
            locations_with_casualties = 0
            locations_with_flooding = 0
            locations_with_infrastructure = 0
            locations_with_agriculture = 0
            total_evacuated = 0
            
            location_summaries = []
            
            for damage in damages:
                content = damage.content
                
                # Get location name - prioritize location_name from content
                location_name = content.get('location_name', '')
                
                # If no location_name, try to reverse geocode from coordinates
                if not location_name:
                    lat = content.get('latitude')
                    lon = content.get('longitude')
                    if lat and lon:
                        location_name = await reverse_geocode(float(lat), float(lon))
                    else:
                        location_name = 'Không xác định'
                
                # Get damages object
                damages_obj = content.get('damages', {})
                
                # Count statistics based on damages object
                if damages_obj.get('casualties'):
                    locations_with_casualties += 1
                if damages_obj.get('flooding'):
                    locations_with_flooding += 1
                if damages_obj.get('infrastructure'):
                    locations_with_infrastructure += 1
                if damages_obj.get('agriculture'):
                    locations_with_agriculture += 1
                
                # Parse evacuated count
                evacuated_text = damages_obj.get('evacuated', '')
                if evacuated_text:
                    import re
                    numbers = re.findall(r'\d+', str(evacuated_text))
                    if numbers:
                        total_evacuated += int(numbers[0])
                
                # Create summary for this location
                summary_parts = []
                if damages_obj.get('casualties'):
                    summary_parts.append(f"👥 {damages_obj['casualties']}")
                if damages_obj.get('infrastructure'):
                    summary_parts.append(f"🏗️ {damages_obj['infrastructure']}")
                if damages_obj.get('agriculture'):
                    summary_parts.append(f"🌾 {damages_obj['agriculture']}")
                if damages_obj.get('flooding'):
                    summary_parts.append(f"🌊 {damages_obj['flooding']}")
                if damages_obj.get('economic'):
                    summary_parts.append(f"💰 {damages_obj['economic']}")
                
                if summary_parts:
                    location_summaries.append(f"  • {location_name}: {', '.join(summary_parts)}")
            
            # Build result
            result = f"""📊 TỔNG HỢP THIỆT HẠI - Cơn bão {storm_id}

📍 Tổng số địa điểm bị ảnh hưởng: {total_locations}
👥 Địa điểm có thiệt hại về người: {locations_with_casualties}
🌊 Địa điểm bị ngập lụt: {locations_with_flooding}
🏗️ Địa điểm hư hại cơ sở hạ tầng: {locations_with_infrastructure}
🌾 Địa điểm thiệt hại nông nghiệp: {locations_with_agriculture}
🚶 Tổng số người được sơ tán: ~{total_evacuated:,}

"""
            
            if location_summaries:
                result += "📋 CHI TIẾT CÁC ĐỊA ĐIỂM:\n"
                result += "\n".join(location_summaries[:20])  # Limit to 20 locations
                if len(location_summaries) > 20:
                    result += f"\n  ... và {len(location_summaries) - 20} địa điểm khác"
            
            return result
        except Exception as e:
            logger.error(f"Error getting damage info: {str(e)}")
            return f"❌ Có lỗi xảy ra khi lấy thông tin thiệt hại: {str(e)}"


async def get_rescue_requests(
    storm_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[int] = None,
    limit: int = 100
) -> str:
    """
    Lấy tổng hợp thông tin cứu hộ, có thể lọc theo cơn bão, trạng thái hoặc mức độ ưu tiên.
    
    Args:
        storm_id: Mã số cơn bão (lọc theo bão)
        status: Trạng thái (pending, in_progress, completed, cancelled)
        priority: Mức độ ưu tiên (1-5, 1 là cao nhất)
        limit: Số lượng yêu cầu tối đa (mặc định 100)
        
    Returns:
        Thống kê tổng quan và danh sách yêu cầu cứu hộ
        
    Examples:
        - Xem tất cả: không truyền tham số
        - Lọc theo bão: storm_id="STORM001"
        - Lọc theo trạng thái: status="pending"
        - Lọc theo mức ưu tiên: priority=1
    """
    from src.rescue.model import rescue_requests
    from src.database import AsyncSessionLocal
    import aiohttp
    
    async def reverse_geocode(lat: float, lon: float) -> str:
        """Convert coordinates to address using Nominatim"""
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": lat,
                "lon": lon,
                "format": "json",
                "addressdetails": 1,
                "accept-language": "vi"
            }
            headers = {"User-Agent": "StormTracker/1.0"}
            
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        address = data.get("address", {})
                        # Build readable address
                        parts = []
                        if address.get("city"):
                            parts.append(address["city"])
                        elif address.get("town"):
                            parts.append(address["town"])
                        elif address.get("village"):
                            parts.append(address["village"])
                        
                        if address.get("state"):
                            parts.append(address["state"])
                        elif address.get("province"):
                            parts.append(address["province"])
                        
                        return ", ".join(parts) if parts else f"{lat:.4f}°N, {lon:.4f}°E"
        except:
            pass
        return f"{lat:.4f}°N, {lon:.4f}°E"
    
    async with AsyncSessionLocal() as session:
        try:
            # Query based on filters
            if storm_id:
                requests = await rescue_requests.get_requests_by_storm(session, storm_id, skip=0, limit=limit)
            elif status:
                requests = await rescue_requests.get_requests_by_status(session, status, skip=0, limit=limit)
            elif priority:
                requests = await rescue_requests.get_requests_by_priority(session, priority, skip=0, limit=limit)
            else:
                requests = await rescue_requests.get_all_requests(session, skip=0, limit=limit)
            
            if not requests:
                return "❌ Không có yêu cầu cứu hộ nào phù hợp với điều kiện tìm kiếm"
            
            # Calculate statistics
            total_requests = len(requests)
            pending_count = sum(1 for r in requests if r.status == "pending")
            in_progress_count = sum(1 for r in requests if r.status == "in_progress")
            completed_count = sum(1 for r in requests if r.status == "completed")
            high_priority_count = sum(1 for r in requests if r.priority and r.priority <= 2)
            verified_count = sum(1 for r in requests if r.verified)
            
            # Build result with statistics
            result = f"""🆘 TỔNG HỢP TÌNH HÌNH CỨU HỘ

📊 THỐNG KÊ:
• Tổng số yêu cầu: {total_requests}
• Đang chờ xử lý: {pending_count}
• Đang cứu hộ: {in_progress_count}
• Đã hoàn thành: {completed_count}
• Ưu tiên cao: {high_priority_count}
• Đã xác thực: {verified_count}

"""
            
            # Group by location and show summary
            location_groups = {}
            for req in requests:
                if req.lat and req.lon:
                    location = await reverse_geocode(float(req.lat), float(req.lon))
                elif req.address:
                    location = req.address
                else:
                    location = "Không xác định"
                
                if location not in location_groups:
                    location_groups[location] = []
                location_groups[location].append(req)
            
            result += "📍 DANH SÁCH YÊU CẦU THEO ĐỊA ĐIỂM:\n\n"
            
            for location, reqs in list(location_groups.items())[:15]:  # Limit to 15 locations
                status_counts = {}
                for req in reqs:
                    status_counts[req.status] = status_counts.get(req.status, 0) + 1
                
                status_text = ", ".join([f"{s}: {c}" for s, c in status_counts.items()])
                result += f"📍 {location}\n"
                result += f"   Số yêu cầu: {len(reqs)} ({status_text})\n"
                
                # Show high priority requests
                high_priority = [r for r in reqs if r.priority and r.priority <= 2 and r.status == "pending"]
                if high_priority:
                    result += f"   🔴 CẦN ƯU TIÊN: {len(high_priority)} yêu cầu\n"
                    for req in high_priority[:3]:  # Show max 3
                        result += f"      • ID {req.request_id}: {req.name or 'N/A'} - {req.phone or 'N/A'}\n"
                        if req.note:
                            result += f"        Ghi chú: {req.note[:50]}...\n"
                
                result += "\n"
            
            if len(location_groups) > 15:
                result += f"... và {len(location_groups) - 15} địa điểm khác\n"
            
            return result
        except Exception as e:
            logger.error(f"Error getting rescue requests: {str(e)}")
            return f"❌ Có lỗi xảy ra khi lấy danh sách yêu cầu cứu hộ: {str(e)}"


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

class GetStormInfoInput(BaseModel):
    storm_id: Optional[str] = Field(None, description="Mã số cơn bão (để trống để lấy danh sách tất cả)")

class GetStormTrackingInput(BaseModel):
    storm_id: str = Field(description="Mã số cơn bão")
    limit: int = Field(10, description="Số lượng điểm tracking (mặc định 10)")

class GetDamageInfoInput(BaseModel):
    storm_id: str = Field(description="Mã số cơn bão")
    limit: int = Field(100, description="Số lượng báo cáo thiệt hại tối đa (mặc định 100)")

class GetRescueRequestsInput(BaseModel):
    storm_id: Optional[str] = Field(None, description="Mã số cơn bão")
    status: Optional[str] = Field(None, description="Trạng thái (pending, in_progress, completed, cancelled)")
    priority: Optional[int] = Field(None, description="Mức độ ưu tiên (1-5)")
    limit: int = Field(100, description="Số lượng yêu cầu tối đa (mặc định 100)")

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

get_storm_info_tool = StructuredTool(
    name="get_storm_info",
    description="Lấy thông tin về một cơn bão cụ thể hoặc danh sách tất cả các cơn bão. Dùng khi người dùng hỏi về thông tin bão, tên bão, thời gian bão.",
    args_schema=GetStormInfoInput,
    coroutine=get_storm_info
)

get_storm_tracking_tool = StructuredTool(
    name="get_storm_tracking",
    description="Lấy dữ liệu theo dõi vị trí và cường độ của cơn bão theo thời gian. Dùng khi người dùng hỏi về đường đi của bão, vị trí bão, cường độ bão.",
    args_schema=GetStormTrackingInput,
    coroutine=get_storm_tracking
)

get_damage_info_tool = StructuredTool(
    name="get_damage_info",
    description="Lấy tổng hợp thông tin thiệt hại do cơn bão gây ra, bao gồm thống kê tổng số địa điểm, người chết/mất tích, người sơ tán, và các loại thiệt hại. Dùng khi người dùng hỏi về thiệt hại, tình hình thiệt hại, mức độ thiệt hại.",
    args_schema=GetDamageInfoInput,
    coroutine=get_damage_info
)

get_rescue_requests_tool = StructuredTool(
    name="get_rescue_requests",
    description="Lấy tổng hợp tình hình cứu hộ bao gồm thống kê số yêu cầu đang chờ, đang xử lý, đã hoàn thành và danh sách chi tiết theo địa điểm. Có thể lọc theo bão, trạng thái hoặc mức độ ưu tiên. Dùng khi người dùng hỏi về tình hình cứu hộ, số lượng yêu cầu cứu hộ.",
    args_schema=GetRescueRequestsInput,
    coroutine=get_rescue_requests
)

# List of all available tools
CHATBOT_TOOLS = [
    search_storm_knowledge_tool,
    create_rescue_request_tool,
    get_storm_info_tool,
    get_storm_tracking_tool,
    get_damage_info_tool,
    get_rescue_requests_tool
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