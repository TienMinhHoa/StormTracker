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
import { getRescueRequestsByStorm, type RescueRequestResponse } from './services/rescueApi';

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
  const [rescueRequests, setRescueRequests] = useState<RescueRequestResponse[]>([]);
  const [loadingRescueRequests, setLoadingRescueRequests] = useState(false);

  // Request location permission on first visit
  useEffect(() => {
    const hasRequestedLocation = localStorage.getItem('locationPermissionRequested');
    
    if (!hasRequestedLocation && navigator.geolocation) {
      // Mark as requested to avoid asking again
      localStorage.setItem('locationPermissionRequested', 'true');
      
      // Request location permission
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location permission granted:', position.coords);
          // Optionally zoom to user location
          if (flyToLocationRef.current) {
            setTimeout(() => {
              flyToLocationRef.current?.(
                position.coords.longitude,
                position.coords.latitude,
                5
              );
            }, 1000); // Small delay to ensure map is ready
          }
        },
        (error) => {
          console.log('⚠️ Location permission denied or error:', error.message);
          // Don't show alert, just log - user can manually request later
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0, // Force fresh location
        }
      );
    }
  }, []); // Run only once on mount

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

  // Fetch rescue requests when rescue tab is active
  useEffect(() => {
    const fetchRescueRequests = async () => {
      if (activeTab !== 'rescue' || !selectedStorm?.storm_id || !showRescueMarkers) {
        setRescueRequests([]);
        return;
      }

      try {
        setLoadingRescueRequests(true);
        console.log('🚨 Fetching rescue requests for map...');
        const data = await getRescueRequestsByStorm(selectedStorm.storm_id, 0, 100);
        setRescueRequests(data);
        console.log(`✅ Loaded ${data.length} rescue requests for map`);
      } catch (error) {
        console.error('❌ Failed to load rescue requests for map:', error);
        setRescueRequests([]);
      } finally {
        setLoadingRescueRequests(false);
      }
    };

    fetchRescueRequests();
  }, [activeTab, selectedStorm, showRescueMarkers]);

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
      flyToLocationRef.current(damage.lon, damage.lat, 5);
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
      flyToLocationRef.current(lng, lat, 5);
    }
  };

  const handleRescueClick = (rescue: RescueRequest) => {
    console.log('🚨 Rescue clicked:', rescue.name, rescue.coordinates);

    // Zoom to rescue location
    if (flyToLocationRef.current && rescue.coordinates && Array.isArray(rescue.coordinates)) {
      const [lng, lat] = rescue.coordinates;
      flyToLocationRef.current(lng, lat, 6.5);
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
      flyToLocationRef.current(warning.lon, warning.lat, 6.5);
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
      flyToLocationRef.current(damageNews.lon, damageNews.lat, 6.5);
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
              <RescueRequestForm 
                onBack={() => setShowRescueForm(false)} 
                stormId={selectedStorm?.storm_id}
              />
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
          rescueRequests={rescueRequests.map(r => ({
            id: r.request_id,
            name: r.name,
            phone: r.phone,
            coordinates: [r.lon, r.lat] as [number, number],
            address: r.address,
            category: r.people_detail?.category || 'other',
            // If status is completed or safe_reported, always set urgency to 'low'
            urgency: (r.status === 'completed' || r.status === 'safe_reported') ? 'low' :
                    (r.priority <= 1 ? 'critical' : r.priority <= 2 ? 'high' : r.priority <= 3 ? 'medium' : 'low'),
            numberOfPeople: r.people_detail?.numberOfPeople || 1,
            description: r.note || 'Không có mô tả',
            status: r.status as 'pending' | 'in-progress' | 'completed' | 'safe_reported',
            timestamp: new Date(r.created_at).toLocaleString('vi-VN'),
            priority: r.priority,
            verified: r.verified,
            note: r.note,
          }))}
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
          onRescueRequestUpdate={async (requestId: number, status: 'completed' | 'safe_reported') => {
            try {
              const { updateRescueRequest } = await import('./services/rescueApi');
              // Update status and priority to 5 (not urgent) when completed or safe_reported
              await updateRescueRequest(requestId, { 
                status,
                priority: 5 // Set to not urgent when completed or safe
              });
              // Refresh rescue requests
              if (selectedStorm?.storm_id && activeTab === 'rescue' && showRescueMarkers) {
                const data = await getRescueRequestsByStorm(selectedStorm.storm_id, 0, 100);
                setRescueRequests(data);
              }
            } catch (error) {
              console.error('Failed to update rescue request:', error);
            }
          }}
        />
      </div>
    </main>
  );
}
