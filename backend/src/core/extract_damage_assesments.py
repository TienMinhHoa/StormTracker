"""
LangChain Agent for extracting damage assessment information from text.
This agent processes text containing damage information (people, infrastructure, facilities)
and extracts structured JSON data.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional
import os
from dotenv import load_dotenv
from src.config import config
load_dotenv()

import httpx

import json
def format_blocks_group_source(data):
    text_blocks = data['text_blocks']
    references = {ref['index']: ref for ref in data['references']}
    lines = []
    i = 0
    while i < len(text_blocks):
        block = text_blocks[i]
        # Heading
        if block['type'] == 'heading':
            lines.append(f"### {block['snippet']}\n")
            # Thu thập tất cả block thuộc mục này (paragraph + list) cho đến heading tiếp theo
            content_lines = []
            source_indexes = set()
            j = i + 1
            while j < len(text_blocks) and text_blocks[j]['type'] != 'heading':
                b = text_blocks[j]
                if b['type'] == 'paragraph':
                    content_lines.append(b['snippet'])
                    if 'reference_indexes' in b:
                        source_indexes.update(b['reference_indexes'])
                elif b['type'] == 'list':
                    for item in b['list']:
                        content_lines.append(f"- {item['snippet']}")
                    if 'reference_indexes' in b:
                        source_indexes.update(b['reference_indexes'])
                j += 1
            # Thêm nội dung
            lines.extend(content_lines)
            # Thêm dòng nguồn 1 lần cho cả mục
            if source_indexes:
                srcs = []
                for r in sorted(source_indexes):
                    if r in references:
                        srcs.append(f"{references[r]['source']} ({references[r]['link']})")
                lines.append("\nNguồn: " + ", ".join(srcs))
            lines.append("")  # dòng trống giữa các heading
            i = j
        else:
            i += 1
    return "\n".join(lines)

async def fetch_damage_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        response = response.json()
    return response


class CasualtyStats(BaseModel):
    """Thống kê thương vong"""
    deaths: Optional[int] = Field(default=None, description="Số người tử vong")
    missing: Optional[int] = Field(default=None, description="Số người mất tích")
    injured: Optional[int] = Field(default=None, description="Số người bị thương")


class PropertyDamage(BaseModel):
    """Thiệt hại về tài sản"""
    houses_damaged: Optional[int] = Field(default=None, description="Số nhà bị hư hỏng/sập/tốc mái")
    houses_flooded: Optional[int] = Field(default=None, description="Số nhà bị ngập")
    boats_damaged: Optional[int] = Field(default=None, description="Số tàu thuyền bị hư hại/chìm")
    description: Optional[str] = Field(default=None, description="Mô tả ngắn gọn 4-5 từ")


class InfrastructureDamage(BaseModel):
    """Thiệt hại về cơ sở hạ tầng"""
    roads_damaged: Optional[int] = Field(default=None, description="Số tuyến đường bị hư hại/sạt lở")
    schools_damaged: Optional[int] = Field(default=None, description="Số trường học bị hư hại")
    hospitals_damaged: Optional[int] = Field(default=None, description="Số bệnh viện/trạm y tế bị hư hại")
    description: Optional[str] = Field(default=None, description="Mô tả ngắn gọn 4-5 từ")


class AgriculturalDamage(BaseModel):
    """Thiệt hại về nông nghiệp"""
    crop_area_damaged_ha: Optional[float] = Field(default=None, description="Diện tích cây trồng bị hư hại (ha)")
    livestock_lost: Optional[int] = Field(default=None, description="Số gia súc/gia cầm chết")
    aquaculture_damaged_ha: Optional[float] = Field(default=None, description="Diện tích nuôi trồng thủy sản bị hại (ha)")
    description: Optional[str] = Field(default=None, description="Mô tả ngắn gọn 4-5 từ")


class DamageAssessment(BaseModel):
    """Model for complete damage assessment - Tối ưu cho dashboard"""
    casualties: Optional[CasualtyStats] = Field(default=None, description="Thống kê thương vong")
    property: Optional[PropertyDamage] = Field(default=None, description="Thiệt hại tài sản")
    infrastructure: Optional[InfrastructureDamage] = Field(default=None, description="Thiệt hại cơ sở hạ tầng")
    agriculture: Optional[AgriculturalDamage] = Field(default=None, description="Thiệt hại nông nghiệp")
    
    total_economic_loss_vnd: Optional[float] = Field(default=None, description="Tổng thiệt hại kinh tế (tỷ đồng)")
    summary: Optional[str] = Field(default=None, description="Tóm tắt 1 câu ngắn gọn")
    sources: Optional[List[str]] = Field(default=None, description="Danh sách tất cả các nguồn thông tin đã sử dụng")


class DamageExtractionAgent:
    """Agent for extracting damage assessment information from text"""
    
    def __init__(self, model_name: str = "gemini-2.5-flash", temperature: float = 0):
        """
        Initialize the damage extraction agent
        
        Args:
            model_name: Gemini model name to use (e.g., gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash)
            temperature: Temperature for model generation (0 = deterministic)
        """
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=config.GOOGLE_API_KEY
        )
        
        # Setup output parser
        self.parser = JsonOutputParser(pydantic_object=DamageAssessment)
        
        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """Bạn là chuyên gia phân tích thiệt hại thiên tai cho dashboard hiện đại.

🎯 NHIỆM VỤ: 
- Văn bản có thể chứa NHIỀU NGUỒN KHÁC NHAU với số liệu khác nhau
- TỔNG HỢP, ĐỐI CHIẾU các nguồn và chọn số liệu đáng tin cậy nhất
- Trích xuất SỐ LIỆU và LIST TẤT CẢ NGUỒN đã sử dụng

📊 CẤU TRÚC ĐẦU RA:

1️⃣ casualties (THƯƠNG VONG):
   - deaths: Số người chết (số nguyên, VD: 6)
   - missing: Số người mất tích (số nguyên, VD: 2)
   - injured: Số người bị thương (số nguyên, VD: 26)
   
2️⃣ property (TÀI SẢN):
   - houses_damaged: Số nhà hư hỏng (VD: 10000)
   - houses_flooded: Số nhà ngập (VD: 5000)
   - boats_damaged: Số tàu thuyền hư hại (VD: 9)
   - description: Mô tả ngắn 4-5 từ (VD: "Hơn 10.000 nhà hư hỏng")

3️⃣ infrastructure (CƠ SỞ HẠ TẦNG):
   - roads_damaged: Số tuyến đường (VD: 15)
   - schools_damaged: Số trường học (VD: 20)
   - hospitals_damaged: Số bệnh viện/trạm y tế (VD: 5)
   - description: Mô tả ngắn 4-5 từ (VD: "Đường sạt lở, mất điện")

4️⃣ agriculture (NÔNG NGHIỆP):
   - crop_area_damaged_ha: Diện tích cây trồng (ha) (VD: 11200.0)
   - livestock_lost: Số gia súc/gia cầm (VD: 5000)
   - aquaculture_damaged_ha: Diện tích thủy sản (ha) (VD: 200.0)
   - description: Mô tả ngắn 4-5 từ (VD: "11.200 ha lúa ngập")

5️⃣ total_economic_loss_vnd:
   - Tổng thiệt hại (tỷ đồng): "13.000 tỷ" -> 13000.0

6️⃣ summary: Tóm tắt 1 câu ngắn

7️⃣ sources: DANH SÁCH TẤT CẢ CÁC NGUỒN
   - List ĐẦY ĐỦ CÁC ĐƯỜNG LINK/URL được đề cập trong văn bản
   - VD: ["https://nhandan.vn/...", "https://vnexpress.net/...", "https://laodong.vn/..."]
   - Trích xuất CHÍNH XÁC URL GỐC từ văn bản

🔑 QUY TẮC TRÍCH XUẤT:
✅ Trích xuất TẤT CẢ SỐ LIỆU có trong văn bản (nếu có)
✅ "Hơn 100" -> 100 | "Ít nhất 6" -> 6 | "Khoảng 26" -> 26
✅ LIST TẤT CẢ CÁC ĐƯỜNG LINK/URL vào trường sources
   - Trích xuất CHÍNH XÁC URL đầy đủ từ văn bản
   - VD: "https://nhandan.vn/bao-so-13-gay-thiet-hai..."
   - Nếu có nhiều URL, list hết tất cả
✅ Không có thông tin: Để null
✅ Mô tả (description) phải NGẮN GỌN 4-5 từ, có thể chứa số liệu
❌ KHÔNG đoán số liệu khi không có thông tin
❌ KHÔNG viết mô tả dài dòng

{format_instructions}"""),
            ("user", "{input_text}")
        ])
        
        # Create the chain
        self.chain = self.prompt | self.llm | self.parser
        
    def extract(self, text: str) -> dict:
        """
        Extract damage assessment from text
        
        Args:
            text: Input text containing damage information
            
        Returns:
            Dictionary containing structured damage assessment
        """
        result = self.chain.invoke({
            "input_text": text,
            "format_instructions": self.parser.get_format_instructions()
        })
        return result
    
    def extract_with_metadata(self, text: str, storm_id: str = None) -> dict:
        """
        Extract damage assessment with additional metadata
        
        Args:
            text: Input text containing damage information
            storm_id: Storm identifier
            
        Returns:
            Dictionary containing structured damage assessment with metadata
        """
        result = self.extract(text)
        
        # Add metadata
        result["metadata"] = {
            "storm_id": storm_id,
            "extraction_timestamp": __import__("datetime").datetime.now().isoformat()
        }
        
        return result
    
    async def extract_and_save_to_db(self, text: str, storm_id: str, 
                                     session) -> dict:
        """
        Extract damage assessment and save to database
        
        Args:
            text: Input text containing damage information
            storm_id: Storm identifier
            session: AsyncSession for database operations
            
        Returns:
            Dictionary containing saved damage assessment with metadata
        """
        from datetime import datetime
        from src.damage.model import damage_assessments
        
        # Extract damage information
        result = self.extract(text)
        
        # Prepare data for database
        detail = result.copy()
        extraction_time = datetime.now()
        
        # Save to database
        db_damage = await damage_assessments.create_damage_assessment(
            session=session,
            storm_id=storm_id,
            detail=detail,
            time=extraction_time.strftime("%d-%m-%Y %H:%M")
        )
        
        # Return result with database ID
        return {
            "id": db_damage.id,
            "storm_id": db_damage.storm_id,
            "detail": result,
            "time": db_damage.time.isoformat(),
            "created_at": db_damage.created_at.isoformat(),
            "message": "Damage assessment saved to database successfully"
        }


async def main():
    from src.config import config
    from src.database import AsyncSessionLocal
    """Example usage"""
    # Sample text (example damage report)
    parameters = {
        "engine": "google_ai_mode",
        "q": "thống kê thiệt hại do bão số 13 gây ra tại Việt Nam cho đến thời điểm hiện tại theo những tiêu chí sau: Thiệt hại về người(số người mất tích, bị thương, tử vong), Thiệt hại về nhà cửa tài sản, thiệt hại về hạ tầng kinh tế, thiệt hại về nông nghiệp sản xuất,  thiệt hại về môi trường và xã hội.",
        "api_key": config.SERPAPI_API_KEY
    }
    url = "https://serpapi.com/search.json"
    
    url = f"{url}?engine={parameters['engine']}&q={parameters['q']}&api_key={parameters['api_key']}"
    data = await fetch_damage_data(url)
    sample_text = format_blocks_group_source(data)
    # Initialize agent
    agent = DamageExtractionAgent()
    
    # Extract damage information
    print("Extracting damage assessment from text...")
    print("=" * 80)
    
    # Create database session and save
    async with AsyncSessionLocal() as session:
        async with session.begin():
            result = await agent.extract_and_save_to_db(
                text=sample_text,
                storm_id="2025305N10138",
                session=session
            )
    
    print(json.dumps(result, ensure_ascii=False, indent=2))



if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
