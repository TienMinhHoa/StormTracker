"""
Extraction service using LLM to extract damage information from text.
"""
import json
import re
from typing import Dict, List
import google.generativeai as genai
from src.config import config
from src.logger import logger


class DamageExtractionService:
    """Service to extract damage information from Vietnamese text using LLM."""
    
    def __init__(self):
        """Initialize the LLM client."""
        genai.configure(api_key=config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    async def extract_damage_by_location(self, text: str) -> List[Dict[str, str]]:
        """
        Extract damage information grouped by location from Vietnamese text.
        
        Args:
            text: Vietnamese text describing damage in various locations
            
        Returns:
            List of dicts with 'location' (address) and 'damages' (list of damage descriptions)
            Example: [
                {
                    "location": "Hà Nội", 
                    "damages": ["100 nhà bị ngập", "5 người chết", "Mất điện toàn bộ quận Hoàn Kiếm"]
                },
                {
                    "location": "Quảng Ninh",
                    "damages": ["50 nhà bị tốc mái", "Cây đổ la liệt"]
                }
            ]
        """
        prompt = f"""
Bạn là một AI chuyên phân tích thiệt hại do thiên tai tại Việt Nam.

Nhiệm vụ: Phân tích đoạn văn bản sau và trích xuất thông tin thiệt hại theo từng địa phương.

Yêu cầu:
1. Xác định các địa danh (tỉnh, thành phố, huyện, xã) được nhắc đến
2. Với mỗi địa danh, liệt kê các thiệt hại cụ thể tại đó (nhà cửa, người chết/bị thương, cơ sở hạ tầng, cây cối, v.v.)
3. Mô tả thiệt hại ngắn gọn, súc tích
4. Chỉ trích xuất thông tin có trong văn bản, không bịa thêm

Văn bản cần phân tích:
\"\"\"
{text}
\"\"\"

Trả về kết quả ở định dạng JSON như sau (chỉ trả về JSON, không thêm text nào khác):
[
  {{
    "location": "Tên địa danh",
    "damages": ["Thiệt hại 1", "Thiệt hại 2", "Thiệt hại 3"]
  }},
  {{
    "location": "Tên địa danh khác",
    "damages": ["Thiệt hại A", "Thiệt hại B"]
  }}
]
"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            result_text = re.sub(r'^```json\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            result_text = result_text.strip()
            
            # Parse JSON
            extracted_data = json.loads(result_text)
            
            logger.info(f"Extracted damage data for {len(extracted_data)} locations")
            return extracted_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
            logger.error(f"Response was: {result_text}")
            return []
        except Exception as e:
            logger.error(f"Error extracting damage information: {str(e)}")
            return []


damage_extraction_service = DamageExtractionService()
