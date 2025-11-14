'use client';

import { useState, useEffect } from 'react';
import NewsDetail from './NewsDetail';
import { NewsItem, newsItems } from './newsData';

const categories = ['All', 'Hurricane', 'Tornado', 'Flood', 'Storm', 'Warning', 'Wildfire'];

type NewsTabProps = {
  onNewsClick?: (news: NewsItem) => void;
  selectedNewsId?: number | null;
};

export default function NewsTab({ onNewsClick, selectedNewsId }: NewsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Update selectedNews when selectedNewsId changes (from marker click)
  useEffect(() => {
    if (selectedNewsId) {
      const news = newsItems.find(item => item.id === selectedNewsId);
      if (news) {
        setSelectedNews(news);
      }
    }
  }, [selectedNewsId]);

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
    : newsItems.filter(item => item.category === selectedCategory);

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
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${selectedCategory === category
                    ? 'bg-[#137fec] text-white'
                    : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredNews.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <button
                  onClick={() => handleNewsClick(item)}
                  className="block group w-full text-left"
                >
                  <div
                    className="aspect-video w-full rounded-lg bg-cover bg-center bg-gray-800 group-hover:opacity-80 transition-opacity"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                </button>
                <h3 className="text-sm font-medium leading-snug text-white">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
