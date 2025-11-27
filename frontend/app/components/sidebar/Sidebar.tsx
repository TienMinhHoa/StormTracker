'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from '../news';
import { ForecastTab } from '../forecast';
import { RescueTab, RescueRequest } from '../rescue';
import { ChatbotTab } from '../chatbot';
import { DamageTab } from '../damage';
import { SettingsPanel } from '../settings';
import { getStorms, type Storm } from '../../services/stormApi';
import { getLiveTracking, type LiveTrackingData } from '../../services/liveApi';

type Tab = 'forecast' | 'rescue' | 'damage' | 'chatbot' | 'settings';

type SidebarProps = {
  onNewsClick?: (news: NewsItem) => void;
  onRescueClick?: (rescue: RescueRequest) => void;
  onDamageClick?: (damage: any) => void;
  onWarningClick?: (warning: any) => void;
  onTabChange?: (tab: Tab) => void;
  onStormChange?: (storm: Storm | null) => void;
  selectedNewsId?: number | null;
  selectedStorm?: Storm | null;
  selectedWarning?: any;
  showNewsMarkers?: boolean;
  onShowNewsMarkersChange?: (show: boolean) => void;
  showRescueMarkers?: boolean;
  onShowRescueMarkersChange?: (show: boolean) => void;
  showWarningMarkers?: boolean;
  onShowWarningMarkersChange?: (show: boolean) => void;
  onWarningTimeChange?: (time: string | null) => void;
  showDamageMarkers?: boolean;
  onShowDamageMarkersChange?: (show: boolean) => void;
  showRescueNewsMarkers?: boolean;
  onShowRescueNewsMarkersChange?: (show: boolean) => void;
  onShowRescueForm?: () => void;
};

export default function Sidebar({
  onNewsClick,
  onRescueClick,
  onDamageClick,
  onWarningClick,
  onTabChange,
  onStormChange,
  selectedNewsId,
  selectedStorm,
  selectedWarning,
  showNewsMarkers = true,
  onShowNewsMarkersChange,
  showRescueMarkers = true,
  onShowRescueMarkersChange,
  showWarningMarkers = true,
  onShowWarningMarkersChange,
  showDamageMarkers = true,
  onShowDamageMarkersChange,
  showRescueNewsMarkers = true,
  onShowRescueNewsMarkersChange,
  onShowRescueForm,
  onWarningTimeChange
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'forecast' | 'rescue' | 'damage' | 'chatbot' | 'settings'>('forecast');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [loadingStorms, setLoadingStorms] = useState(true);
  const [selectedStormLocal, setSelectedStormLocal] = useState<Storm | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [stormFilter, setStormFilter] = useState<'recent3' | 'recent10' | 'all' | 'realtime'>('recent3');
  const [filteredStorms, setFilteredStorms] = useState<Storm[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [liveData, setLiveData] = useState<LiveTrackingData | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Client-side only mount check
  useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load storms from API
  useEffect(() => {
    const loadStorms = async () => {
      try {
        setLoadingStorms(true);
        const stormsData = await getStorms(0, 100);
        
        // Sort storms by start_date descending (most recent first)
        const sortedStorms = [...stormsData].sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        
        setStorms(sortedStorms);
        
        // Apply initial filter
        filterStorms(sortedStorms, stormFilter);
      } catch (error) {
        console.error('❌ Failed to load storms:', error);
      } finally {
        setLoadingStorms(false);
      }
    };

    loadStorms();
  }, []);

  // Filter storms based on selected filter
  const filterStorms = async (allStorms: Storm[], filter: typeof stormFilter) => {
    let filtered: Storm[] = [];
    
    if (filter === 'realtime') {
      // Real-time mode: Query live tracking data
      setIsLoadingLive(true);
      try {
        const liveTrackingData = await getLiveTracking('NOWLIVE1234');
        setLiveData(liveTrackingData);
        
        // Create a virtual storm from live data
        const liveStorm: Storm = {
          storm_id: 'NOWLIVE1234',
          name: '🔴 Live Tracking',
          start_date: liveTrackingData.timestamp,
          end_date: null,
          description: `Live tracking: ${liveTrackingData.status}`,
        };
        
        filtered = [liveStorm];
        setFilteredStorms(filtered);
        setSelectedStormLocal(liveStorm);
        onStormChange?.(liveStorm);
        console.log('🔴 Live mode activated:', liveTrackingData);
      } catch (error) {
        console.error('❌ Failed to load live tracking:', error);
        setLiveData(null);
        filtered = [];
        setFilteredStorms(filtered);
        setSelectedStormLocal(null);
        onStormChange?.(null as any);
      } finally {
        setIsLoadingLive(false);
      }
    } else {
      // Normal mode: show historical storms
      setLiveData(null);
      if (filter === 'recent3') {
        filtered = allStorms.slice(0, 3);
      } else if (filter === 'recent10') {
        filtered = allStorms.slice(0, 10);
      } else {
        filtered = allStorms;
      }
      
      setFilteredStorms(filtered);
      
      // Auto-select first storm if needed
      if (filtered.length > 0 && !selectedStorm && !selectedStormLocal) {
        const firstStorm = filtered[0];
        setSelectedStormLocal(firstStorm);
        onStormChange?.(firstStorm);
        console.log('🌪️ Auto-selected first storm:', firstStorm.name);
      }
    }
  };

  // Re-filter when filter changes
  useEffect(() => {
    if (storms.length > 0) {
      filterStorms(storms, stormFilter);
    }
  }, [stormFilter]);

  // Ensure selectedStorm is synced when selectedStormLocal changes (only on initial load)
  useEffect(() => {
    if (selectedStormLocal && (!selectedStorm || selectedStorm.storm_id !== selectedStormLocal.storm_id)) {
      // Only sync if parent doesn't have the same storm (to avoid infinite loops)
      onStormChange?.(selectedStormLocal);
      console.log('🔄 Syncing selected storm to parent:', selectedStormLocal.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStormLocal?.storm_id]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleStormChange = (storm: Storm) => {
    setSelectedStormLocal(storm);
    onStormChange?.(storm);
  };

  // Resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Limit width between 280px and 600px
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const currentStorm = selectedStorm || selectedStormLocal;

  return (
    <>
      {/* Mobile Hamburger Button - Fixed to top-left */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center bg-[#101922] border border-white/10 rounded-lg text-white shadow-lg hover:bg-[#1c2127] transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:absolute left-0 top-0 h-full z-40 bg-[#101922] border-r border-white/10 transition-all ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isCollapsed ? 'w-12' : 'max-w-full'}
          ${isResizing ? '' : 'duration-300'}
        `}
        style={!isCollapsed && isMounted ? { width: `${sidebarWidth}px` } : undefined}
      >
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
            <div className="p-4 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-3">
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
                {/* Close button - show on mobile for drawer, desktop for collapse */}
                <button
                  onClick={() => {
                    if (isMobile) {
                      setIsMobileOpen(false);
                    } else {
                      setIsCollapsed(true);
                    }
                  }}
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

              {/* Storm Filter */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                <button
                  onClick={() => setStormFilter('recent3')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stormFilter === 'recent3'
                      ? 'bg-teal-600 text-white'
                      : 'bg-[#1c2127] text-gray-400 hover:text-white'
                  }`}
                  title="3 cơn gần nhất"
                >
                  3 gần
                </button>
                <button
                  onClick={() => setStormFilter('recent10')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stormFilter === 'recent10'
                      ? 'bg-teal-600 text-white'
                      : 'bg-[#1c2127] text-gray-400 hover:text-white'
                  }`}
                  title="10 cơn gần nhất"
                >
                  10 gần
                </button>
                <button
                  onClick={() => setStormFilter('all')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stormFilter === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'bg-[#1c2127] text-gray-400 hover:text-white'
                  }`}
                  title="Tất cả cơn bão"
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStormFilter('realtime')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stormFilter === 'realtime'
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-[#1c2127] text-gray-400 hover:text-white'
                  }`}
                  title="Chế độ thời gian thực - chỉ hiện bão đang hoạt động"
                >
                  🔴 Live
                </button>
              </div>

              {/* Storm Selector */}
              <div className="relative">
                {loadingStorms ? (
                  <div className="w-full bg-[#1c2127] border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-400">
                    Đang tải...
                  </div>
                ) : filteredStorms.length === 0 ? (
                  <div className="w-full bg-[#1c2127] border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-400 text-center">
                    {stormFilter === 'realtime' ? '⏱️ Không có bão đang hoạt động' : 'Không có dữ liệu'}
                  </div>
                ) : (
                  <>
                    <select
                      value={currentStorm?.storm_id || ''}
                      onChange={(e) => {
                        const storm = filteredStorms.find(s => s.storm_id === e.target.value);
                        if (storm) handleStormChange(storm);
                      }}
                      className="w-full bg-[#1c2127] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none"
                      disabled={filteredStorms.length === 0}
                    >
                      {filteredStorms.map((storm) => (
                        <option key={storm.storm_id} value={storm.storm_id}>
                          {storm.name} {storm.end_date ? '(Đã kết thúc)' : '🔴 Đang hoạt động'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-4 py-3">
              <div className="grid grid-cols-4 h-10 flex-1 items-center justify-center rounded-lg bg-[#1c2127] p-1 gap-1">
                <button
                  onClick={() => handleTabChange('forecast')}
                  className={`flex h-full items-center justify-center rounded-lg px-1 text-xs font-medium transition-all ${activeTab === 'forecast'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                  Dự báo
                </button>
                <button
                  onClick={() => handleTabChange('rescue')}
                  className={`flex h-full items-center justify-center rounded-lg px-1 text-xs font-medium transition-all ${activeTab === 'rescue'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                  Cứu hộ
                </button>
                <button
                  onClick={() => handleTabChange('damage')}
                  className={`flex h-full items-center justify-center rounded-lg px-1 text-xs font-medium transition-all ${activeTab === 'damage'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                  Thiệt hại
                </button>
                <button
                  onClick={() => handleTabChange('chatbot')}
                  className={`flex h-full items-center justify-center rounded-lg px-1 text-xs font-medium transition-all ${activeTab === 'chatbot'
                      ? 'bg-[#101922] shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                  💬
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'forecast' && (
                <ForecastTab 
                  onNewsClick={onNewsClick} 
                  selectedNewsId={selectedNewsId} 
                  stormId={currentStorm?.storm_id}
                  storm={currentStorm}
                  showNewsMarkers={showNewsMarkers}
                  onShowNewsMarkersChange={onShowNewsMarkersChange}
                  onWarningClick={onWarningClick}
                  selectedWarning={selectedWarning}
                  showWarningMarkers={showWarningMarkers}
                  onShowWarningMarkersChange={onShowWarningMarkersChange}
                  onWarningTimeChange={onWarningTimeChange}
                />
              )}
              {activeTab === 'rescue' && (
                <RescueTab 
                  onRescueClick={onRescueClick} 
                  stormId={currentStorm?.storm_id}
                  showRescueMarkers={showRescueMarkers}
                  onShowRescueMarkersChange={onShowRescueMarkersChange}
                  showRescueNewsMarkers={showRescueNewsMarkers}
                  onShowRescueNewsMarkersChange={onShowRescueNewsMarkersChange}
                  onShowRescueForm={onShowRescueForm}
                />
              )}
              {activeTab === 'damage' && (
                <DamageTab 
                  stormId={currentStorm?.storm_id} 
                  onDamageClick={onDamageClick}
                  showDamageMarkers={showDamageMarkers}
                  onShowDamageMarkersChange={onShowDamageMarkersChange}
                />
              )}
              {activeTab === 'chatbot' && <ChatbotTab stormId={currentStorm?.storm_id} />}
              {activeTab === 'settings' && (
                <SettingsPanel
                  showNewsMarkers={showNewsMarkers}
                  onShowNewsMarkersChange={onShowNewsMarkersChange || (() => {})}
                  showRescueMarkers={showRescueMarkers}
                  onShowRescueMarkersChange={onShowRescueMarkersChange || (() => {})}
                  showWarningMarkers={showWarningMarkers}
                  onShowWarningMarkersChange={onShowWarningMarkersChange || (() => {})}
                  onClose={() => setActiveTab('forecast')}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors w-full text-left"
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
                <p className="text-white text-sm font-medium">Cài đặt</p>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Resize Handle - Only show on desktop when not collapsed */}
      {!isCollapsed && (
        <div
          className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-teal-500 transition-colors z-10 group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-full bg-teal-500 rounded-full"></div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
