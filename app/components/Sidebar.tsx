'use client';

import { useState } from 'react';
import NewsTab, { NewsItem } from './NewsTab';
import WarningsTab from './WarningsTab';
import ChatbotTab from './ChatbotTab';

type Tab = 'news' | 'warnings' | 'chatbot';

type SidebarProps = {
  onNewsClick?: (news: NewsItem) => void;
};

export default function Sidebar({ onNewsClick }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('warnings');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`absolute left-0 top-0 h-full z-20 bg-[#101922] border-r border-white/10 transition-[width] duration-300 ease-in-out ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      <div className="flex flex-col h-full">
        {isCollapsed ? (
          /* Collapsed state - only show expand button */
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1c2127] transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        ) : (
          /* Expanded state - show full header */
          <>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-teal-600 rounded-full size-10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-white text-base font-medium leading-normal">
                  Storm Tracker
                </h1>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-4 py-3">
              <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#1c2127] p-1 gap-1">
                <button
                  onClick={() => setActiveTab('news')}
                  className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                    activeTab === 'news'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  News
                </button>
                <button
                  onClick={() => setActiveTab('warnings')}
                  className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                    activeTab === 'warnings'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Warnings
                </button>
                <button
                  onClick={() => setActiveTab('chatbot')}
                  className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                    activeTab === 'chatbot'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Chatbot
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'news' && <NewsTab onNewsClick={onNewsClick} />}
              {activeTab === 'warnings' && <WarningsTab />}
              {activeTab === 'chatbot' && <ChatbotTab />}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-white text-sm font-medium">Settings</p>
              </a>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

