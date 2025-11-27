"""
Script to extract damage information from text description using Gemini LLM,
geocode addresses to lat-lon, and inject into damage_details table.

Usage:
    python extract_and_inject_damages.py
"""
import asyncio
import json
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import google.generativeai as genai

from src.database import AsyncSessionLocal
from src.damage_details.model import damage_details
from src.damage_details.geocoding_service import geocoding_service
from src.logger import logger
from src.config import config


class DamageExtractor:
    """Extract damage information from Vietnamese text using Gemini LLM."""
    
    def __init__(self):
        """Initialize Gemini API."""
        genai.configure(api_key=config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def extract_damage_by_location(self, text: str) -> Dict[str, Dict]:
        """
        Extract damage information organized by location using Gemini LLM.
        
        Args:
            text: Vietnamese text describing damages by location
            
        Returns:
            Dictionary with location information and damage descriptions
        """
        prompt = f"""
Bạn là một chuyên gia phân tích thiệt hại thiên tai. Hãy trích xuất thông tin thiệt hại từ đoạn văn bản tiếng Việt sau.

NHIỆM VỤ:
1. Xác định TẤT CẢ các địa điểm được đề cập (tỉnh, thành phố, huyện, xã, vùng...)
2. Với mỗi địa điểm, tóm tắt thiệt hại theo các loại:
   - flooding: Ngập lụt, lũ lụt
   - wind_damage: Thiệt hại do gió, bão, cây đổ, nhà tốc mái
   - infrastructure: Thiệt hại hạ tầng (đường, cầu, nhà cửa, điện nước)
   - agriculture: Thiệt hại nông nghiệp (lúa, cây trồng, vật nuôi)
   - casualties: Thương vong, thiệt mạng, mất tích
   - evacuated: Số người sơ tán, di dời
   - economic: Thiệt hại kinh tế (số tiền, tỷ đồng)

VĂN BẢN:
{text}

YÊU CẦU OUTPUT:
Trả về JSON array với format:
[
  {{
    "location": "Tên địa điểm chính xác",
    "damages": {{
      "flooding": "Mô tả ngắn gọn về ngập lụt",
      "wind_damage": "Mô tả ngắn gọn về thiệt hại gió bão",
      "infrastructure": "Mô tả ngắn gọn về hạ tầng",
      "agriculture": "Mô tả ngắn gọn về nông nghiệp",
      "casualties": "Số người thiệt mạng/mất tích",
      "evacuated": "Số người sơ tán",
      "economic": "Thiệt hại kinh tế"
    }}
  }}
]

CHÚ Ý:
- CHỈ bao gồm các loại thiệt hại có thông tin trong văn bản
- Mô tả ngắn gọn, súc tích (tối đa 1-2 câu)
- Nếu có số liệu cụ thể thì ghi rõ
- Trả về JSON hợp lệ, không thêm markdown hay text khác
"""
        
        try:
            # Call Gemini API
            logger.info("Calling Gemini API to extract damage information...")
            response = self.model.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            extracted_data = json.loads(response_text)
            logger.info(f"Successfully extracted {len(extracted_data)} locations from text")
            
            # Geocode each location
            result = {}
            for item in extracted_data:
                location_name = item["location"]
                logger.info(f"Geocoding location: {location_name}")
                
                # Geocode location to lat-lon
                coords = await geocoding_service.geocode_address(location_name)
                if coords:
                    lat, lon = coords
                    location_key = geocoding_service.format_location_key(lat, lon)
                    
                    # Clean up damages - remove empty values
                    damages = {k: v for k, v in item["damages"].items() if v and v.strip()}
                    
                    result[location_key] = {
                        "location_name": location_name,
                        "latitude": lat,
                        "longitude": lon,
                        "damages": damages
                    }
                    logger.info(f"Successfully processed {location_name}: {len(damages)} damage types")
                else:
                    logger.warning(f"Could not geocode location: {location_name}")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
            logger.error(f"Response text: {response_text}")
            return {}
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return {}


async def inject_damage_data(
    storm_id: str,
    damage_text: str,
    session: AsyncSession
) -> int:
    """
    Extract damage information from text using Gemini LLM and inject into database.
    
    Args:
        storm_id: ID of the storm
        damage_text: Text description of damages by location
        session: Database session
        
    Returns:
        Number of records inserted
    """
    logger.info(f"Extracting damage information for storm {storm_id}")
    
    # Initialize extractor
    extractor = DamageExtractor()
    
    # Extract damage data organized by location using Gemini
    damage_data = await extractor.extract_damage_by_location(damage_text)
    
    if not damage_data:
        logger.warning("No damage data extracted from text")
        return 0
    
    # Inject each location's damage into database
    count = 0
    for location_key, data in damage_data.items():
        try:
            await damage_details.create_damage_detail(
                session=session,
                storm_id=storm_id,
                content={
                    "location_key": location_key,
                    "location_name": data["location_name"],
                    "latitude": data["latitude"],
                    "longitude": data["longitude"],
                    "damages": data["damages"]
                }
            )
            count += 1
            logger.info(f"Inserted damage record for {data['location_name']}")
        except Exception as e:
            logger.error(f"Error inserting damage record: {str(e)}")
    
    await session.commit()
    logger.info(f"Successfully inserted {count} damage records")
    return count


async def main():
    """Main function to run the extraction and injection."""
    
    # Sample damage text in Vietnamese
    sample_text = """
    CẬP NHẬT TÌNH HÌNH THIỆT HẠI DO MƯA LŨ TẠI CÁC TỈNH MIỀN TRUNG
(Cập nhật tính đến 8h00 ngày 24/11/2025) 
1️⃣ Thiệt hại về người: 102 người chết, mất tích: 91 người chết (Quảng Trị 01, Huế 02, Đà Nẵng 02, Gia Lai 03, Đắk Lắk 63, Khánh Hòa 15 (tăng 01 do tìm thấy 01 người mất tích), Lâm Đồng 05); 11 người mất tích (Đà Nẵng 02, Đắk Lắk 08, Khánh Hòa 01).
2️⃣ Về nhà:  221 nhà bị sập đổ: Quảng Ngãi 09, Gia Lai 127, Đắk Lắk 09, Lâm Đồng 76.
✅933 nhà bị hư hỏng: Quảng Trị 03, Đà Nẵng 46, Quảng Ngãi 71, Gia Lai 59, Khánh Hòa 05, Lâm Đồng 749.
✅200.992 nhà bị ngập: Gia Lai 19.200, Đắk Lắk 150.000, Khánh Hòa 30.655 (tăng 15.259 sau rà soát), Lâm Đồng 1.137. Hiện tỉnh Đắk Lắk còn 02 xã, tỉnh Lâm Đồng còn 127 hộ dân bị ngập.
3️⃣Về nông nghiệp.
✅82.147 ha lúa, hoa màu bị thiệt hại: Quảng Trị 79ha, Đà Nẵng 59ha, Đắk Lắk 63.000ha, Khánh Hòa 14.552ha (tăng 1.252ha), Lâm Đồng 4.457ha (tăng 11ha).
✅ 117.067 ha cây trồng lâu năm bị thiệt hại: Quảng Trị 10ha, Đà Nẵng 53ha, Quảng Ngãi 04ha, Đắk Lắk 117.000ha.
✅ 3.339.352 con gia súc, gia cầm bị chết, cuốn trôi: Quảng Trị 848 con, Đà Nẵng 352 con, Quảng Ngãi 29 con, Gia Lai 34.497 con, Đắk Lắk 3.200.000 con, Khánh Hòa 94.563 con (tăng 70.100 con), Lâm Đồng 9.063 con (tăng 13 con).
✅ 1.157 ha thủy sản thiệt hại (Đắk Lắk 1.000ha, Khánh Hòa 157ha).
4️⃣Về giao thông: Còn 15 vị trí trên Quốc lộ 20 và 27C bị sạt lở cục bộ gây ách tắc: Khánh Hòa: 12 vị trí trên QL27C; Lâm Đồng: 02 vị trí trên QL20 (tại Đèo Mimosa, Đèo D’ran) và 01 vị trí trên QL27C.
5️⃣ Về đường sắt:
✅ Còn lại 15 điểm đang khắc phục thuộc khu gian Đông Tác - Phú Hiệp và Phú Hiệp - Hảo Sơn do ảnh hưởng xả thuỷ điện của sông Ba Hạ.
✅Kế hoạch chuyển tải: Bãi bỏ các tàu SE4, SNT2 ngày 23/11, SNT1 ngày 23/11, tàu SE21/22 ngày 24/11; chuyển tải hành khách trên tàu từ ga Giã (Khánh Hòa) đi đến ga Tuy Hòa (Đắk Lắk) và ngược lại (60km) trong các ngày 23-24/11/2025 đối với các tàu SE1, SE2, SE3, SE6, SE8, SE47. Dự kiến 24h00 ngày 25/11 trả đường toàn tuyến Hà Nội - TP. Hồ Chí Minh.
6️⃣ Về điện: 1.191.085 KH mất điện, đã khôi phục 1.137.690KH, còn mất điện 53.395 KH (Gia Lai: 3.026KH; Đắk Lắk: 44.941KH; Khánh Hòa: 5.428KH).
7️⃣ Về thông tin liên lạc
- Mạng truyền số liệu chuyên dùng cấp 2 (từ tỉnh đến xã): Hiện còn 62/301 xã phường bị mất kết nối do mất điện (Gia Lai 16/135, Đắk Lắk 29/102, Khánh Hòa 17/64).
- Mạng công cộng: 343 trạm BTS bị mất kết nối (Đắk Lắk 233, Khánh Hòa 110).
▶️ Ước thiệt hại sơ bộ ban đầu về kinh tế: 13.078 tỷ đồng (Quảng Ngãi 650 tỷ đồng, Gia Lai 1.000 tỷ đồng, Đắk Lắk 5.330 tỷ đồng, Khánh Hòa 5.000 tỷ đồng, Lâm Đồng 1.098 tỷ đồng).
▶️Hiện các địa phương đang tiếp tục rà soát, tổng hợp thiệt hại; dọn dẹp, vệ sinh môi trường và tổ chức khắc phục hậu quả thiên tai.
    """
    
    # Storm ID to associate with damages
    storm_id = "NOWLIVE1234"  # Change this to your actual storm ID
    
    # Create database session
    async with AsyncSessionLocal() as session:
        try:
            count = await inject_damage_data(storm_id, sample_text, session)
            print(f"\n{'='*60}")
            print(f"Extraction and injection completed!")
            print(f"Total records inserted: {count}")
            print(f"{'='*60}\n")
        except Exception as e:
            logger.error(f"Error in main: {str(e)}")
            await session.rollback()
            raise


if __name__ == "__main__":
    print("\nStarting damage extraction and injection process...")
    print("=" * 60)
    asyncio.run(main())
