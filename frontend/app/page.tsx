'use client';

import { useRef, useState, useEffect } from 'react';
import { Map } from './components/map';
import { Sidebar } from './components/sidebar';
import { NewsItem } from './components/news';
import { RescueRequest, rescueRequests, RescueRequestForm } from './components/rescue';
import type { Storm } from './services/stormApi';
import { getNewsByStorm, type News } from './services/newsApi';
import { getWarnings, type Warning } from './services/warningApi';
import { getDamageNewsByStorm, type DamageNews } from './services/damageApi';

export default function Home() {
  const flyToLocationRef = useRef<((lng: number, lat: number, zoom?: number) => void) | null>(null);
  const [activeTab, setActiveTab] = useState<'forecast' | 'rescue' | 'damage' | 'chatbot'>('forecast');
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [selectedStorm, setSelectedStorm] = useState<Storm | null>(null); // Will be set by Sidebar when storms load
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [showNewsMarkers, setShowNewsMarkers] = useState(true); // Default to true
  const [showRescueMarkers, setShowRescueMarkers] = useState(true); // Default to true
  const [showWarningMarkers, setShowWarningMarkers] = useState(true); // Default to true
  const [warningItems, setWarningItems] = useState<Warning[]>([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [selectedWarningTime, setSelectedWarningTime] = useState<string | null>(null);
  const [showDamageMarkers, setShowDamageMarkers] = useState(true); // Default to true
  const [damageNewsItems, setDamageNewsItems] = useState<DamageNews[]>([]);
  const [loadingDamageNews, setLoadingDamageNews] = useState(false);
  const [showRescueForm, setShowRescueForm] = useState(false);

  // Fetch news when selectedStorm changes
  useEffect(() => {
    const fetchNews = async () => {
      if (!selectedStorm?.storm_id) {
        setNewsItems([]);
        return;
      }

      try {
        setLoadingNews(true);
        console.log(`📰 Fetching news for storm: ${selectedStorm.storm_id}`);
        const newsData = await getNewsByStorm(selectedStorm.storm_id, 0, 100);
        
        // Convert API News to NewsItem format
        const converted: NewsItem[] = newsData.map((news: News) => ({
          id: news.news_id,
          title: news.title,
          image: news.thumbnail_url || `https://picsum.photos/400/300?random=${news.news_id}`,
          coordinates: [news.lon, news.lat],
          category: news.category === 'Du_bao_Canh_bao_bao' ? 'Dự báo & Cảnh báo' :
                   news.category === 'Ho_tro_Cuu_tro' ? 'Hỗ trợ & Cứu trợ' :
                   news.category === 'Thiet_hai_Hau_qua' ? 'Thiệt hại & Hậu quả' : news.category,
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
        }));
        
        setNewsItems(converted);
        console.log(`✅ Loaded ${converted.length} news items for map`);
      } catch (error) {
        console.error('❌ Failed to load news for map:', error);
        setNewsItems([]);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchNews();
  }, [selectedStorm]);

  // Fetch warnings when forecast tab is active or time changes
  useEffect(() => {
    const fetchWarnings = async () => {
      if (activeTab !== 'forecast' || !showWarningMarkers) {
        setWarningItems([]);
        return;
      }

      try {
        setLoadingWarnings(true);
        console.log('⚠️ Fetching warnings for map...', selectedWarningTime ? `at ${selectedWarningTime}` : 'current');
        const data = await getWarnings(6, selectedWarningTime || undefined);
        setWarningItems(data);
        console.log(`✅ Loaded ${data.length} warnings for map`);
      } catch (error) {
        console.error('❌ Failed to load warnings for map:', error);
        setWarningItems([]);
      } finally {
        setLoadingWarnings(false);
      }
    };

    fetchWarnings();
  }, [activeTab, showWarningMarkers, selectedWarningTime]);

  // Fetch damage news when damage tab is active
  useEffect(() => {
    const fetchDamageNews = async () => {
      if (activeTab !== 'damage' || !selectedStorm?.storm_id || !showDamageMarkers) {
        setDamageNewsItems([]);
        return;
      }

      try {
        setLoadingDamageNews(true);
        console.log('🏗️ Fetching damage news for map...');
        const data = await getDamageNewsByStorm(selectedStorm.storm_id);
        setDamageNewsItems(data);
        console.log(`✅ Loaded ${data.length} damage news for map`);
      } catch (error) {
        console.error('❌ Failed to load damage news for map:', error);
        setDamageNewsItems([]);
      } finally {
        setLoadingDamageNews(false);
      }
    };

    fetchDamageNews();
  }, [activeTab, selectedStorm, showDamageMarkers]);

  const handleMapReady = (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => {
    flyToLocationRef.current = flyToLocation;
  };

  const handleTabChange = (tab: 'forecast' | 'rescue' | 'damage' | 'chatbot' | 'settings') => {
    setActiveTab(tab);
    // Clear selected news when changing tabs
    if (tab !== 'forecast') {
      setSelectedNewsId(null);
    }
  };

  const handleStormChange = (storm: Storm | null) => {
    if (storm) {
      console.log('🌪️ Storm changed:', storm.name);
    } else {
      console.log('⏱️ Real-time mode: No active storms');
    }
    setSelectedStorm(storm);
  };

  const handleDamageClick = (damage: any) => {
    console.log('🏗️ Damage clicked:', damage);

    // Zoom to damage location
    if (flyToLocationRef.current && damage.lat && damage.lon) {
      flyToLocationRef.current(damage.lon, damage.lat, 10);
    }
  };

  const handleNewsClick = (news: NewsItem) => {
    console.log('📍 News clicked:', news.title, news.coordinates);

    // Set selected news id to trigger detail view
    setSelectedNewsId(news.id);

    // Make sure we're on forecast tab
    if (activeTab !== 'forecast') {
      setActiveTab('forecast');
    }

    // Zoom to news location
    if (flyToLocationRef.current && news.coordinates && Array.isArray(news.coordinates)) {
      const [lng, lat] = news.coordinates;
      flyToLocationRef.current(lng, lat, 10);
    }
  };

  const handleRescueClick = (rescue: RescueRequest) => {
    console.log('🚨 Rescue clicked:', rescue.name, rescue.coordinates);

    // Zoom to rescue location
    if (flyToLocationRef.current && rescue.coordinates && Array.isArray(rescue.coordinates)) {
      const [lng, lat] = rescue.coordinates;
      flyToLocationRef.current(lng, lat, 12);
    }
  };

  const handleWarningClick = (warning: any) => {
    console.log('⚠️ Warning clicked:', warning.commune_name);

    // Set selected warning to trigger expand in sidebar
    setSelectedWarning(warning);

    // Make sure we're on forecast tab
    if (activeTab !== 'forecast') {
      setActiveTab('forecast');
    }

    // Zoom to warning location
    if (flyToLocationRef.current && warning.lat && warning.lon) {
      flyToLocationRef.current(warning.lon, warning.lat, 11);
    }
  };

  const handleDamageNewsClick = (damageNews: DamageNews) => {
    console.log('🏗️ Damage news clicked:', damageNews.title);

    // Make sure we're on damage tab
    if (activeTab !== 'damage') {
      setActiveTab('damage');
    }

    // Zoom to damage location
    if (flyToLocationRef.current && damageNews.lat && damageNews.lon) {
      flyToLocationRef.current(damageNews.lon, damageNews.lat, 12);
    }
  };

  return (
    <main className="relative h-screen w-full bg-[#101922] overflow-hidden">
      {/* Fullscreen Popup Modal for Rescue Form */}
      {showRescueForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1f2e] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-[#1a1f2e] border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gửi yêu cầu cứu hộ</h2>
              <button
                onClick={() => setShowRescueForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <RescueRequestForm onBack={() => setShowRescueForm(false)} />
            </div>
          </div>
        </div>
      )}

      <Sidebar
        onNewsClick={handleNewsClick}
        onRescueClick={handleRescueClick}
        onDamageClick={handleDamageClick}
        onDamageNewsClick={handleDamageNewsClick}
        onWarningClick={handleWarningClick}
        onTabChange={handleTabChange}
        onStormChange={handleStormChange}
        selectedNewsId={selectedNewsId}
        selectedStorm={selectedStorm}
        selectedWarning={selectedWarning}
        showNewsMarkers={showNewsMarkers}
        onShowNewsMarkersChange={setShowNewsMarkers}
        showRescueMarkers={showRescueMarkers}
        onShowRescueMarkersChange={setShowRescueMarkers}
        showWarningMarkers={showWarningMarkers}
        onShowWarningMarkersChange={setShowWarningMarkers}
        showDamageMarkers={showDamageMarkers}
        onShowDamageMarkersChange={setShowDamageMarkers}
        onShowRescueForm={() => setShowRescueForm(true)}
        onWarningTimeChange={setSelectedWarningTime}
      />
      <div className="absolute inset-0 md:left-0">
        <Map
          onMapReady={handleMapReady}
          rescueRequests={rescueRequests}
          newsItems={newsItems}
          warningItems={warningItems}
          damageNewsItems={damageNewsItems}
          activeTab={activeTab}
          onNewsClick={handleNewsClick}
          onWarningClick={handleWarningClick}
          onDamageNewsClick={handleDamageNewsClick}
          selectedStorm={selectedStorm}
          showNewsMarkers={showNewsMarkers}
          showRescueMarkers={showRescueMarkers}
          showWarningMarkers={showWarningMarkers}
          showDamageMarkers={showDamageMarkers}
        />
      </div>
    </main>
  );
}
