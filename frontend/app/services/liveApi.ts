/**
 * Live Tracking API Service
 * Uses Next.js API routes to proxy requests (avoid CORS)
 */

export interface LiveTrackingData {
  id: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  wind_speed?: number;
  pressure?: number;
  status: string;
  additional_info?: any;
}

/**
 * Lấy dữ liệu live tracking theo ID
 */
export async function getLiveTracking(trackingId: string = 'NOWLIVE1234'): Promise<LiveTrackingData> {
  try {
    const response = await fetch(`/api/live/${trackingId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch live tracking data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching live tracking:', error);
    throw error;
  }
}

/**
 * Lấy lịch sử live tracking theo ID
 */
export async function getLiveTrackingHistory(trackingId: string = 'NOWLIVE1234', limit: number = 50): Promise<LiveTrackingData[]> {
  try {
    const response = await fetch(`/api/live/${trackingId}/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch live tracking history: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching live tracking history:', error);
    throw error;
  }
}
