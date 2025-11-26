"""
Script to seed Storm Knowledge Base into Qdrant
Run this script to initialize the knowledge base with storm-related information
"""
import asyncio
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from src.config import config
import uuid


# Knowledge base data about storms, preparation, first aid, and rescue
KNOWLEDGE_BASE = [
    {
        "title": "Chuẩn bị trước khi bão đến",
        "content": """
        1. Theo dõi tin tức về bão từ nguồn chính thống
        2. Dự trữ lương thực, thực phẩm cho ít nhất 3-5 ngày
        3. Chuẩn bị nước sạch đủ dùng (ít nhất 3 lít/người/ngày)
        4. Sạc đầy điện thoại, pin dự phòng
        5. Chuẩn bị đèn pin, nến, diêm
        6. Kiểm tra và gia cố nhà cửa
        7. Cắt tỉa cây xanh gần nhà
        8. Chuẩn bị thuốc men, dụng cụ y tế cơ bản
        9. Cất giữ giấy tờ quan trọng ở nơi an toàn
        10. Di chuyển đồ đạc, tài sản lên cao
        """,
        "category": "preparation",
        "keywords": ["chuẩn bị", "trước bão", "dự trữ", "gia cố"]
    },
    {
        "title": "Những vật dụng cần thiết khi có bão",
        "content": """
        VẬT DỤNG THIẾT YẾU:
        - Lương thực: gạo, mì tôm, bánh khô, thực phẩm đóng hộp
        - Nước uống: nước đóng chai, bình chứa nước
        - Thuốc men: thuốc cơ bản (hạ sốt, đau bụng, băng gạc, cồn)
        - Điện: đèn pin, pin dự phòng, máy phát điện nhỏ
        - Liên lạc: điện thoại đã sạc đầy, radio
        - Bảo vệ: áo mưa, ủng, găng tay
        - Vệ sinh: xà phòng, khăn, nước rửa tay khô
        - Giấy tờ: CMND, giấy khai sinh, sổ đỏ (cho vào túi chống nước)
        - Tiền mặt: để dự phòng khi mất điện, không rút được tiền
        """,
        "category": "preparation",
        "keywords": ["vật dụng", "cần thiết", "thiết yếu", "đồ dùng"]
    },
    {
        "title": "Hành động khi bão đang đổ bộ",
        "content": """
        TRONG LÚC BÃO:
        1. Ở trong nhà, tránh xa cửa sổ, cửa ra vào
        2. Tắt các thiết bị điện, rút phích cắm
        3. Không ra ngoài trừ trường hợp khẩn cấp
        4. Nếu nhà bị hư hại nghiêm trọng, di chuyển đến nơi trú ẩn an toàn
        5. Tránh xuống hầm, tầng trệt nếu có nguy cơ ngập lụt
        6. Lên tầng cao nếu nước dâng
        7. Giữ liên lạc với chính quyền địa phương
        8. Nghe tin từ radio hoặc TV về tình hình bão
        9. Không sử dụng nến khi có mùi gas
        10. Giữ bình tĩnh, không hoảng loạn
        """,
        "category": "during_storm",
        "keywords": ["trong bão", "đổ bộ", "hành động", "phòng tránh"]
    },
    {
        "title": "Sau khi bão tan",
        "content": """
        SAU BÃO:
        1. Không ra ngoài ngay, chờ thông báo an toàn
        2. Kiểm tra nhà cửa, phát hiện hư hỏng
        3. Cẩn thận với đường dây điện đứt, cây đổ
        4. Không đi qua vùng nước lũ
        5. Không uống nước không đảm bảo vệ sinh
        6. Vệ sinh môi trường, phòng dịch bệnh
        7. Kiểm tra thực phẩm, loại bỏ đồ ăn hỏng
        8. Chụp ảnh thiệt hại để làm hồ sơ bảo hiểm
        9. Báo cáo thiệt hại với chính quyền
        10. Giúp đỡ người xung quanh nếu có thể
        """,
        "category": "after_storm",
        "keywords": ["sau bão", "bão tan", "khắc phục"]
    },
    {
        "title": "Sơ cứu cơ bản trong bão",
        "content": """
        CÁC TÌNH HUỐNG SƠ CỨU:
        
        1. VẾT THƯƠNG CHẢY MÁU:
        - Rửa sạch vết thương bằng nước sạch
        - Dùng gạc hoặc vải sạch ép vào vết thương
        - Băng bó cố định, không quá chặt
        - Nếu máu không cầm, tăng áp lực và giơ cao phần bị thương
        
        2. GÃY XƯƠNG:
        - Không di chuyển người bị thương nếu không cần thiết
        - Cố định vùng gãy bằng nẹp hoặc vật cứng
        - Không cố chỉnh lại xương
        - Gọi cấp cứu ngay
        
        3. ĐIỆN GIẬT:
        - Ngắt nguồn điện trước khi tiếp cận
        - Không chạm trực tiếp vào người bị điện giật
        - Dùng vật cách điện đẩy dây điện ra
        - Kiểm tra hô hấp, tim đập, thực hiện CPR nếu cần
        
        4. NGẠT NƯỚC:
        - Đưa người lên bờ, đặt nghiêng đầu
        - Kiểm tra đường thở, lấy chướng ngại vật ra
        - Thực hiện hô hấp nhân tạo và ép tim nếu cần
        - Gọi cấp cứu ngay
        """,
        "category": "first_aid",
        "keywords": ["sơ cứu", "cứu thương", "vết thương", "gãy xương", "điện giật"]
    },
    {
        "title": "Cách thực hiện CPR (hồi sức tim phổi)",
        "content": """
        CPR - CẤP CỨU HÔ HẤP TIM PHỔI:
        
        KIỂM TRA:
        1. Kiểm tra ý thức: gọi to, vỗ vai
        2. Kiểm tra hô hấp: nhìn ngực có lên xuống không
        3. Kiểm tra mạch: đặt 2 ngón lên động mạch cảnh
        
        NẾU KHÔNG CÓ Ý THỨC, KHÔNG HÔ HẤP:
        1. Gọi cấp cứu 115 ngay
        2. Đặt người nằm ngửa trên mặt phẳng cứng
        3. Ấn tim:
           - Đặt 2 tay chồng lên nhau ở giữa xương ức
           - Tay thẳng, dùng trọng lượng cơ thể ấn sâu 5-6cm
           - Tốc độ 100-120 lần/phút
           - 30 lần ấn tim
        4. Thổi ngạt:
           - Ngửa đầu, nâng cằm mở đường thở
           - Bịt mũi, thổi vào miệng 2 lần (mỗi lần 1 giây)
        5. Tiếp tục chu kỳ 30:2 cho đến khi:
           - Người bệnh tỉnh lại
           - Xe cấp cứu đến
           - Bạn kiệt sức hoàn toàn
        
        LƯU Ý: Nếu không biết thổi ngạt, chỉ ấn tim cũng có thể cứu sống
        """,
        "category": "first_aid",
        "keywords": ["CPR", "hồi sức", "cấp cứu", "ấn tim", "thổi ngạt"]
    },
    {
        "title": "Cách gọi cứu hộ hiệu quả",
        "content": """
        KHI CẦN CỨU HỘ, CUNG CẤP THÔNG TIN:
        
        1. VỊ TRÍ CHÍNH XÁC:
        - Địa chỉ chi tiết (số nhà, đường, phường, quận)
        - Điểm mốc gần nhất (trường học, chợ, cây xăng...)
        - Tọa độ GPS nếu có
        
        2. TÌNH TRẠNG KHẨN CẤP:
        - Số người cần cứu
        - Tình trạng sức khỏe (có người bị thương, già yếu, trẻ em)
        - Mức độ nguy hiểm (nước ngập sâu, nhà sắp sập...)
        
        3. THÔNG TIN LIÊN LẠC:
        - Số điện thoại
        - Tên người liên hệ
        - Cách liên lạc thay thế nếu mất sóng
        
        4. HÀNH ĐỘNG CHỜ CỨU HỘ:
        - Ở vị trí cao, an toàn
        - Giữ điện thoại còn pin
        - Không di chuyển nếu không cần thiết
        - Mặc áo sáng màu để dễ nhìn thấy
        - Vẫy tay, hô hoán khi thấy đội cứu hộ
        
        SỐ ĐIỆN THOẠI KHẨN CẤP:
        - Cấp cứu: 115
        - Cảnh sát: 113
        - Cứu hỏa: 114
        - Cứu hộ cứu nạn: 112
        """,
        "category": "rescue",
        "keywords": ["cứu hộ", "gọi cứu hộ", "khẩn cấp", "cấp cứu"]
    },
    {
        "title": "Xử lý tình huống ngập lụt",
        "content": """
        KHI BỊ NGẬP LỤT:
        
        TRONG NHÀ:
        1. Di chuyển lên tầng cao
        2. Mang theo điện thoại, nước, thực phẩm
        3. Tắt điện, gas toàn bộ
        4. Không cố di chuyển đồ đạc nặng
        5. Gọi cứu hộ nếu nước dâng nhanh
        
        NGOÀI ĐƯỜNG:
        1. Không đi qua vùng nước lũ
        2. Nước ngập 15cm có thể cuốn ngã người
        3. Nước ngập 30cm có thể cuốn xe máy
        4. Nước ngập 60cm có thể cuốn ô tô
        5. Tìm địa điểm cao để trú ẩn
        6. Không chạy xe qua đường ngập
        
        TRONG Ô TÔ BỊ NGẬP:
        1. Mở cửa ngay khi xe bắt đầu chìm
        2. Nếu không mở được cửa, đập cửa kính
        3. Ra khỏi xe càng nhanh càng tốt
        4. Bơi lên trên, tránh bị cuốn theo dòng nước
        
        SAU KHI NƯỚC RÚT:
        1. Không trở về nhà ngay
        2. Kiểm tra kết cấu nhà trước khi vào
        3. Cẩn thận với rắn, côn trùng
        4. Khử trùng nước, vệ sinh môi trường
        5. Tiêm phòng bệnh sau lũ
        """,
        "category": "flood",
        "keywords": ["ngập lụt", "lũ lụt", "nước lũ", "nước ngập"]
    },
    {
        "title": "Phòng tránh dịch bệnh sau bão",
        "content": """
        PHÒNG CHỐNG DỊCH BỆNH SAU BÃO:
        
        VỆ SINH MÔI TRƯỜNG:
        1. Vệ sinh nhà cửa, khử trùng bằng clo
        2. Thu dọn rác thải, xác động vật chết
        3. Phun thuốc diệt muỗi
        4. Thông thoáng nhà cửa
        
        VỆ SINH CÁ NHÂN:
        1. Rửa tay thường xuyên bằng xà phòng
        2. Tắm rửa sạch sẽ sau tiếp xúc nước lũ
        3. Không để vết thương hở tiếp xúc nước bẩn
        4. Đeo khẩu trang khi dọn dẹp
        
        AN TOÀN THỰC PHẨM:
        1. Không ăn thực phẩm ngâm nước lũ
        2. Luộc sôi nước uống
        3. Nấu chín thức ăn
        4. Bảo quản thực phẩm đúng cách
        
        DỊCH BỆNH CẦN ĐỀ PHÒNG:
        - Tiêu chảy, tả
        - Sốt xuất huyết
- Viêm gan A
        - Viêm kết mạc mắt
        - Bệnh ngoài da
        - Leptospirosis (bệnh do vi khuẩn từ chuột)
        
        KHI NÀO CẦN ĐẾN BẠC SĨ:
        - Sốt cao, đau đầu
        - Tiêu chảy kéo dài
        - Vết thương sưng đỏ, mủ
        - Phát ban ngoài da
        - Vàng da, vàng mắt
        """,
        "category": "health",
        "keywords": ["dịch bệnh", "vệ sinh", "phòng bệnh", "sức khỏe"]
    },
    {
        "title": "Hướng dẫn sơ tán an toàn",
        "content": """
        KẾ HOẠCH SƠ TÁN:
        
        CHUẨN BỊ TRƯỚC:
        1. Xác định điểm sơ tán gần nhất
        2. Lên kế hoạch di chuyển đến đó
        3. Chuẩn bị túi đồ khẩn cấp sẵn sàng
        4. Thống nhất địa điểm tập trung với gia đình
        
        TÚI ĐỒ KHẨN CẤP GỒM:
        - Giấy tờ quan trọng (trong túi chống nước)
        - Thuốc men cần thiết
        - Quần áo thay
        - Đèn pin, pin dự phòng
        - Thực phẩm khô, nước uống
        - Tiền mặt
        - Sạc dự phòng điện thoại
        - Khẩu trang, dung dịch sát khuẩn
        
        KHI SƠ TÁN:
        1. Nghe theo chỉ dẫn của chính quyền
        2. Tắt điện, nước, gas
        3. Khóa cửa nhà
        4. Mang theo thú nuôi nếu có thể
        5. Di chuyển theo đúng tuyến đường
        6. Không quay lại nhà khi chưa có thông báo an toàn
        
        TẠI NƠI SƠ TÁN:
        1. Đăng ký với ban quản lý
        2. Tuân thủ nội quy
        3. Giữ gìn vệ sinh chung
        4. Hỗ trợ lẫn nhau
        5. Theo dõi thông tin từ chính quyền
        """,
        "category": "evacuation",
        "keywords": ["sơ tán", "di dời", "trú ẩn", "lánh nạn"]
    },
    {
        "title": "An toàn điện trong mùa bão",
        "content": """
        AN TOÀN ĐIỆN KHI CÓ BÃO:
        
        TRƯỚC BÃO:
        1. Kiểm tra hệ thống điện trong nhà
        2. Chuẩn bị aptomat, cầu chì dự phòng
        3. Rút phích cắm thiết bị không cần thiết
        4. Sạc đầy các thiết bị di động
        
        TRONG BÃO:
        1. Tắt nguồn điện chính nếu có ngập nước
        2. Không chạm vào thiết bị điện khi tay ướt
        3. Không sử dụng thiết bị điện trong phòng tắm
        4. Tránh xa cửa sổ có dây điện
        
        SAU BÃO:
        1. Không bật điện nếu nhà bị ngập
        2. Kiểm tra hệ thống điện trước khi dùng
        3. Gọi thợ điện kiểm tra nếu nghi ngờ hư hỏng
        4. Cẩn thận với dây điện đứt ngoài trời
        
        KHI THẤY DÂY ĐIỆN ĐỨT:
        1. Giữ khoảng cách an toàn (>10m)
        2. Không chạm vào người bị điện giật
        3. Gọi điện lực ngay (19001909)
        4. Cảnh báo người khác không lại gần
        
        KHI BỊ ĐIỆN GIẬT:
        1. Ngắt nguồn điện ngay
        2. Dùng vật cách điện đẩy người ra
        3. Gọi cấp cứu 115
        4. Thực hiện CPR nếu cần và biết cách
        """,
        "category": "electrical_safety",
        "keywords": ["điện", "an toàn điện", "điện giật", "dây điện"]
    },
    {
        "title": "Chăm sóc trẻ em và người già trong bão",
        "content": """
        BẢO VỆ NGƯỜI DỄ BỊ TỔN THƯƠNG:
        
        TRẺ EM:
        1. Giữ trẻ ở nơi an toàn, có người lớn giám sát
        2. Giải thích tình hình phù hợp với độ tuổi
        3. Chuẩn bị đồ chơi, sách để trẻ bớt lo lắng
        4. Giữ ấm cơ thể trẻ
        5. Chuẩn bị thức ăn, sữa phù hợp
        6. Mang theo thuốc men riêng của trẻ
        7. Giữ liên lạc với trẻ mọi lúc
        
        TRẺ SƠ SINH:
        - Sữa, bình sữa, tã
        - Quần áo ấm
        - Chăn mỏng
        - Thuốc hạ sốt cho trẻ
        - Nhiệt kế
        
        NGƯỜI GIÀ:
        1. Kiểm tra sức khỏe thường xuyên
        2. Chuẩn bị đầy đủ thuốc men đang dùng
        3. Giữ ấm, tránh bị lạnh
        4. Đảm bảo dinh dưỡng đầy đủ
        5. Hỗ trợ di chuyển khi cần
        6. Lưu số điện thoại bác sĩ
        7. Chuẩn bị thiết bị y tế cần thiết (oxy, máy đo huyết áp...)
        
        NGƯỜI KHUYẾT TẬT:
        1. Chuẩn bị thiết bị hỗ trợ (xe lăn, gậy, máy trợ thính...)
        2. Lên kế hoạch sơ tán phù hợp
        3. Thông báo với chính quyền để được hỗ trợ
        4. Chuẩn bị thuốc men đặc biệt
        
        LƯU Ý:
        - Ưu tiên sơ tán người yếu trước
        - Luôn có người lớn khỏe mạnh đi cùng
        - Mang theo đủ thuốc men cho nhiều ngày
        - Giữ liên lạc với cơ sở y tế
        """,
        "category": "vulnerable_groups",
        "keywords": ["trẻ em", "người già", "chăm sóc", "bảo vệ"]
    },
    {
        "title": "Bảo vệ thú nuôi trong bão",
        "content": """
        CHUẨN BỊ CHO THÚ NUÔI:
        
        TRƯỚC BÃO:
        1. Chuẩn bị thức ăn, nước cho 5-7 ngày
        2. Đảm bảo vắc-xin còn hiệu lực
        3. Chuẩn bị lồng/chuồng di động
        4. Mang theo thuốc thú y cần thiết
        5. Gắn thẻ tên, số điện thoại chủ
        6. Chụp ảnh thú nuôi (để tìm nếu thất lạc)
        
        TRONG BÃO:
        1. Giữ thú nuôi trong nhà
        2. Đặt thú trong lồng nếu hoảng loạn
        3. Đưa đến nơi cao nếu có ngập
        4. Giữ bình tĩnh để thú không sợ hãi
        5. Không để thú tự do chạy ra ngoài
        
        SƠ TÁN:
        1. Mang thú đi cùng nếu có thể
        2. Nếu phải để lại: để trong nhà, nhiều nước/thức ăn
        3. Một số nơi sơ tán không nhận thú nuôi
        4. Tìm người thân hoặc bạn bè giữ hộ
        5. Liên hệ tổ chức cứu hộ động vật
        
        SAU BÃO:
        1. Kiểm tra sức khỏe thú nuôi
        2. Để thú trong nhà đến khi an toàn
        3. Cẩn thận với thú bị stress, có thể cắn
        4. Tìm kiếm ngay nếu thú bị thất lạc
        5. Đăng thông tin lên mạng xã hội để tìm
        """,
        "category": "pets",
        "keywords": ["thú nuôi", "chó mèo", "động vật", "bảo vệ"]
    }
]


async def seed_knowledge_base(qdrant_url: str = None, qdrant_port: int = None):
    """
    Seed the knowledge base into Qdrant
    
    Args:
        qdrant_url: Qdrant server URL (defaults to config.QDRANT_HOST)
        qdrant_port: Qdrant server port (defaults to config.QDRANT_PORT)
    """
    print("🚀 Starting knowledge base seeding...")
    
    # Use config values if not provided
    qdrant_url = qdrant_url or config.QDRANT_URL
    qdrant_api = qdrant_port or config.QDRANT_API_KEY
    
    # Initialize Qdrant client
    client = AsyncQdrantClient(url=qdrant_url, api_key=qdrant_api)
    collection_name = "storm_knowledge"
    
    # Initialize embeddings with 768 dimensions
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=config.GOOGLE_API_KEY,
        task_type="retrieval_document"
    )
    
    # Recreate collection
    try:
        client.delete_collection(collection_name)
        print(f"✅ Deleted existing collection: {collection_name}")
    except Exception:
        print(f"ℹ️ Collection {collection_name} does not exist yet")
    
    # Create new collection
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )
    print(f"✅ Created collection: {collection_name}")
    
    # Prepare points for insertion
    points = []
    for idx, knowledge in enumerate(KNOWLEDGE_BASE):
        print(f"📝 Processing: {knowledge['title']}...")
        
        # Create searchable text
        searchable_text = f"{knowledge['title']}\n{knowledge['content']}\nKeywords: {', '.join(knowledge['keywords'])}"
        
        # Generate embedding
        embedding = embeddings.embed_query(searchable_text)
        # breakpoint()
        # Create point
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "title": knowledge["title"],
                "content": knowledge["content"],
                "category": knowledge["category"],
                "keywords": knowledge["keywords"]
            }
        )
        points.append(point)
    
    # Insert all points
    client.upsert(
        collection_name=collection_name,
        points=points
    )
    print(f"✅ Inserted {len(points)} knowledge entries into Qdrant")
    
    # Verify insertion
    collection_info = client.get_collection(collection_name)
    print(f"✅ Collection info: {collection_info.points_count} points")
    
    print("🎉 Knowledge base seeding completed successfully!")


if __name__ == "__main__":
    print("=" * 60)
    print("Storm Tracker - Knowledge Base Seeding Script")
    print("=" * 60)
    
    # Run seeding
    asyncio.run(seed_knowledge_base())
