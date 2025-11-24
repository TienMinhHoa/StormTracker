'use client';

import { NewsItem } from './newsData';
import SafeBackgroundImage from '../common/SafeBackgroundImage';

type NewsDetailProps = {
  news: NewsItem;
  onBack: () => void;
};

export default function NewsDetail({ news, onBack }: NewsDetailProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#101922]">
      {/* Fixed Header with Back Button */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back to News</span>
        </button>
      </div>

      {/* Fixed Image */}
      <div className="flex-shrink-0 px-4 pt-4">
        <SafeBackgroundImage
          src={news.image}
          className="w-full h-48 bg-cover bg-center bg-gray-800 rounded-xl shadow-lg"
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Meta Information */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span className="bg-[#137fec] text-white px-2.5 py-1 rounded-full font-medium">
                {news.category}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {news.date}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                By {news.author}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-white leading-tight">
              {news.title}
            </h1>

            {/* Location Info */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {news.coordinates[1].toFixed(4)}°N, {news.coordinates[0].toFixed(4)}°E
              </span>
            </div>

            {/* Content */}
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {news.content}
            </div>

            {/* Source URL */}
            {news.source_url && (
              <div className="pt-4 border-t border-white/10">
                <a
                  href={news.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#137fec] hover:text-[#137fec]/80 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Xem nguồn gốc
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-white/10 flex gap-3">
              <button className="flex-1 px-4 py-2.5 bg-[#137fec] text-white rounded-xl hover:bg-[#137fec]/90 transition-all text-sm font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button className="flex-1 px-4 py-2.5 bg-gray-700/60 text-white rounded-xl hover:bg-gray-700 transition-all text-sm font-medium hover:scale-[1.02] flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
