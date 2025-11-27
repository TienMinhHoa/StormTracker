"""
Script để tóm tắt tin tức sử dụng Gemini AI
Đọc tin tức từ database, tóm tắt và cập nhật lại vào trường content
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import google.generativeai as genai

from src.database import AsyncSessionLocal
from src.models import NewsSource
from src.config import config
from src.logger import logger


# Cấu hình Gemini
genai.configure(api_key=config.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')


def create_summary_prompt(title: str, content: str, category: str = None) -> str:
    """
    Tạo prompt cho Gemini để tóm tắt tin tức
    """
    if category and "thiệt hại" in category.lower():
        return f"""
Bạn là một trợ lý AI chuyên tóm tắt tin tức về thiên tai.

Tiêu đề: {title}
Nội dung: {content}

Hãy tóm tắt tin tức này theo định dạng sau:
- Mỗi thiệt hại chính chỉ ghi 4-5 từ
- Mỗi thiệt hại xuống dòng riêng
- Tập trung vào số liệu cụ thể (người chết, người mất tích, nhà cửa hư hại, diện tích ngập, v.v.)

Ví dụ format:
- 5 người chết, 10 mất tích
- 200 nhà đổ sập hoàn toàn
- 1000 ha lúa bị ngập
- Thiệt hại ước tính 50 tỷ

Chỉ trả về các dòng tóm tắt, không thêm giải thích.
"""
    elif category and "cứu hộ" in category.lower():
        return f"""
Bạn là một trợ lý AI chuyên tóm tắt tin tức về cứu trợ thiên tai.

Tiêu đề: {title}
Nội dung: {content}

Hãy tóm tắt tin tức này theo định dạng sau:
- Nguồn cứu trợ (4-5 từ)
- Vật phẩm cứu trợ (4-5 từ)
- Tiến độ hiện tại (4-5 từ)
- Mỗi thông tin xuống dòng riêng

Ví dụ format:
- Nguồn: Chính phủ, Bộ Quốc phòng
- Hàng: 500 tấn gạo, thuốc men
- Tiến độ: Đã đến 3/5 vùng

Chỉ trả về các dòng tóm tắt, không thêm giải thích.
"""
    else:
        return f"""
Bạn là một trợ lý AI chuyên tóm tắt tin tức về thiên tai.

Tiêu đề: {title}
Nội dung: {content}

Hãy tóm tắt tin tức này thành 3-5 dòng ngắn gọn (mỗi dòng 4-6 từ), tập trung vào:
- Thông tin quan trọng nhất
- Số liệu cụ thể (nếu có)
- Địa điểm và thời gian (nếu có)

Mỗi điểm xuống dòng riêng.
Chỉ trả về các dòng tóm tắt, không thêm giải thích.
"""


async def summarize_with_gemini(title: str, content: str, category: str = None) -> str:
    """
    Sử dụng Gemini để tóm tắt tin tức
    """
    try:
        prompt = create_summary_prompt(title, content, category)
        response = model.generate_content(prompt)
        
        if response and response.text:
            summary = response.text.strip()
            logger.info(f"Đã tóm tắt thành công: {title[:50]}...")
            return summary
        else:
            logger.warning(f"Không nhận được response từ Gemini cho: {title[:50]}...")
            return content  # Trả về nội dung gốc nếu không tóm tắt được
            
    except Exception as e:
        logger.error(f"Lỗi khi tóm tắt với Gemini: {str(e)}")
        return content  # Trả về nội dung gốc nếu có lỗi


async def process_news_summarization(
    session: AsyncSession,
    limit: int = None,
    category_filter: str = None,
    storm_id_filter: str = None
):
    """
    Xử lý tóm tắt tin tức
    
    Args:
        session: Database session
        limit: Giới hạn số lượng tin tức cần xử lý (None = tất cả)
        category_filter: Lọc theo category (None = tất cả)
        storm_id_filter: Lọc theo storm_id (None = tất cả)
    """
    # Tạo query
    query = select(NewsSource)
    
    if storm_id_filter:
        query = query.where(NewsSource.storm_id == storm_id_filter)
    
    if category_filter:
        query = query.where(NewsSource.category == category_filter)
    
    query = query.order_by(NewsSource.published_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    result = await session.execute(query)
    news_list = result.scalars().all()
    
    logger.info(f"Tìm thấy {len(news_list)} tin tức cần xử lý")
    
    # Xử lý từng tin tức
    success_count = 0
    error_count = 0
    
    for news in news_list:
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"Đang xử lý tin: ID={news.news_id}")
            logger.info(f"Tiêu đề gốc: {news.title}")
            logger.info(f"Category: {news.category}")
            logger.info(f"Độ dài nội dung gốc: {len(news.content) if news.content else 0} ký tự")
            
            # Tóm tắt
            summarized_content = await summarize_with_gemini(
                news.title,
                news.content,
                news.category
            )
            
            # Cập nhật vào database
            news.content = summarized_content
            # breakpoint()
            # await session.flush()
            
            logger.info(f"Độ dài nội dung mới: {len(summarized_content)} ký tự")
            logger.info(f"Nội dung mới:\n{summarized_content}")
            logger.info(f"✓ Đã cập nhật thành công tin ID={news.news_id}")
            
            success_count += 1
            
            # Delay nhỏ để tránh rate limit
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"✗ Lỗi khi xử lý tin ID={news.news_id}: {str(e)}")
            error_count += 1
            continue
    
    # Commit tất cả thay đổi
    await session.commit()
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Hoàn thành!")
    logger.info(f"Thành công: {success_count}/{len(news_list)}")
    logger.info(f"Lỗi: {error_count}/{len(news_list)}")


async def main():
    """
    Hàm chính
    """
    logger.info("Bắt đầu quá trình tóm tắt tin tức...")
    
    async with AsyncSessionLocal() as session:
        # Tùy chỉnh các tham số tại đây:
        await process_news_summarization(
            session=session,
            limit=None,  # None = xử lý tất cả, hoặc số lượng cụ thể như 10, 20
            category_filter=None,  # None = tất cả category, hoặc "thiệt hại", "cứu hộ"
            storm_id_filter=None  # None = tất cả storm, hoặc storm_id cụ thể
        )
    
    logger.info("Hoàn tất quá trình tóm tắt tin tức!")


if __name__ == "__main__":
    asyncio.run(main())
