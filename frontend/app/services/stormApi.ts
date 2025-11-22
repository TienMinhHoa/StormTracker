/**
 * Storm API Service
 * Uses Next.js API routes to proxy requests (avoid CORS)
 */

export interface Storm {
  storm_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface StormTrack {
  track_id: number;
  storm_id: string;
  timestamp: string;
  lat: number;
  lon: number;
  category: number;
  wind_speed: number;
}

/**
 * Get list of storms
 */
export async function getStorms(skip: number = 0, limit: number = 100): Promise<Storm[]> {
  try {
    const response = await fetch(
      `/api/storms?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch storms: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching storms:', error);
    throw error;
  }
}

/**
 * Get tracks for a specific storm
 */
export async function getStormTracks(stormId: string): Promise<StormTrack[]> {
  try {
    const response = await fetch(
      `/api/storms/${stormId}/tracks`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tracks for storm ${stormId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching tracks for storm ${stormId}:`, error);
    throw error;
  }
}

/**
 * Get a single storm by ID
 */
export async function getStorm(stormId: string): Promise<Storm | null> {
  try {
    const storms = await getStorms(0, 1000);
    return storms.find(s => s.storm_id === stormId) || null;
  } catch (error) {
    console.error(`❌ Error fetching storm ${stormId}:`, error);
    return null;
  }
}

