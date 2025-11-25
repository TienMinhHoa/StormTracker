'use client';

import { useState, useEffect } from 'react';
import NewsDetail from './NewsDetail';
import { NewsItem } from './newsData';
import { getNewsByStorm, type News } from '../../services/newsApi';
import SafeBackgroundImage from '../common/SafeBackgroundImage';

// Category mapping from API to display names
const categoryDisplayNames: Record<string, string> = {
  'Du_bao_Canh_bao_bao': 'Dự báo & Cảnh báo',
  'Ho_tro_Cuu_tro': 'Hỗ trợ & Cứu trợ',
  'Thiet_hai_Hau_qua': 'Thiệt hại & Hậu quả',
};

const categories = ['All', 'Du_bao_Canh_bao_bao', 'Ho_tro_Cuu_tro', 'Thiet_hai_Hau_qua'];

type NewsTabProps = {
  onNewsClick?: (news: NewsItem) => void;
  selectedNewsId?: number | null;
  stormId?: string;
  showNewsMarkers?: boolean;
  onShowNewsMarkersChange?: (show: boolean) => void;
};

// Convert API News to NewsItem format
const convertNewsToNewsItem = (news: News): NewsItem => ({
  id: news.news_id,
  title: news.title,
  image: news.thumbnail_url || `https://picsum.photos/400/300?random=${news.news_id}`,
  coordinates: [news.lon, news.lat],
  category: categoryDisplayNames[news.category] || news.category,
  date: new Date(news.published_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),
  author: 'Nguồn tin tức',
  content: news.content,
  source_url: news.source_url,
});

export default function NewsTab({ onNewsClick, selectedNewsId, stormId, showNewsMarkers = true, onShowNewsMarkersChange }: NewsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch news from API when stormId changes
  useEffect(() => {
    const fetchNews = async () => {
      if (!stormId) {
        setNewsItems([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`📰 Fetching news for storm: ${stormId}`);
        const newsData = await getNewsByStorm(stormId, 0, 100);
        const converted = newsData.map(convertNewsToNewsItem);
        setNewsItems(converted);
        console.log(`✅ Loaded ${converted.length} news items`);
      } catch (err) {
        console.error('❌ Failed to load news:', err);
        setError('Không thể tải tin tức. Vui lòng thử lại sau.');
        setNewsItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [stormId]);

  // Update selectedNews when selectedNewsId changes (from marker click)
  useEffect(() => {
    if (selectedNewsId && newsItems.length > 0) {
      const news = newsItems.find(item => item.id === selectedNewsId);
      if (news) {
        setSelectedNews(news);
      }
    }
  }, [selectedNewsId, newsItems]);

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    onNewsClick?.(news);
  };

  const handleBack = () => {
    setSelectedNews(null);
  };

  // Filter news by category
  const filteredNews = selectedCategory === 'All'
    ? newsItems
    : newsItems.filter(item => {
        // Map display name back to API category for filtering
        const apiCategory = Object.keys(categoryDisplayNames).find(
          key => categoryDisplayNames[key] === item.category
        ) || item.category;
        return apiCategory === selectedCategory;
      });

  // Show detail view if a news item is selected
  if (selectedNews) {
    return <NewsDetail news={selectedNews} onBack={handleBack} />;
  }

  // Show list view
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-scroll overflow-y-hidden pb-2 -mx-4 px-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${selectedCategory === category
                    ? 'bg-[#137fec] text-white'
                    : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                {category === 'All' ? 'Tất cả' : categoryDisplayNames[category] || category}
              </button>
            ))}
          </div>

          {/* Marker Toggle - Between category and content */}
          {onShowNewsMarkersChange && (
            <div className="flex items-center justify-end -mx-4 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Hiển thị marker</span>
                <button
                  onClick={() => onShowNewsMarkersChange(!showNewsMarkers)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showNewsMarkers ? 'bg-[#137fec]' : 'bg-gray-600'
                  }`}
                  title={showNewsMarkers ? 'Ẩn marker' : 'Hiện marker'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showNewsMarkers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400 text-sm">Đang tải tin tức...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          {/* News Grid */}
          {!loading && !error && (
            filteredNews.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400 text-sm">Không có tin tức nào</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredNews.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2">
                    <button
                      onClick={() => handleNewsClick(item)}
                      className="block group w-full text-left"
                    >
                      <SafeBackgroundImage
                        src={item.image}
                        className="aspect-video w-full rounded-lg bg-cover bg-center bg-gray-800 group-hover:opacity-80 transition-opacity"
                      />
                    </button>
                    <button
                      onClick={() => handleNewsClick(item)}
                      className="text-left group"
                    >
                      <h3 className="text-sm font-medium leading-snug text-white group-hover:text-[#137fec] transition-colors">
                        {item.title}
                      </h3>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
