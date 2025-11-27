/**
 * Forecast API Service
 * Handles forecast data fetching from backend
 */

/**
 * Forecast data structure
 */
export interface ForecastPosition {
  lat: number;
  lon: number;
}

export interface ForecastIntensity {
  wind_kt: number | string;
  gust_kt: number | string;
}

export interface ForecastMovement {
  direction: string | null;
  speed_kts: number | string | null;
}

export interface ForecastDangerZone {
  lat_range: [number, number];
  lon_range: [number, number];
}

export interface ForecastCurrent {
  time: string;
  position: ForecastPosition;
  intensity: ForecastIntensity;
  movement: ForecastMovement;
  risk_level: number | null;
}

export interface ForecastItem {
  time: string;
  position: ForecastPosition;
  intensity: ForecastIntensity;
  movement: ForecastMovement;
  danger_zone?: ForecastDangerZone;
  risk_level?: number;
}

export interface ForecastLongRange {
  time_range: string;
  movement: ForecastMovement;
  intensity_trend: string;
}

export interface ForecastData {
  current: ForecastCurrent;
  forecast: ForecastItem[];
  long_range: ForecastLongRange;
}

export interface Forecast {
  forecast_id: number;
  storm_id: string;
  nchmf?: ForecastData | null;
  jtwc?: ForecastData | null;
  created_at: string;
}

/**
 * Fetch the latest forecast for a storm
 */
export async function getLatestForecast(stormId: string): Promise<Forecast | null> {
  try {
    const response = await fetch(`/api/forecasts/storm/${stormId}/latest`);
    
    if (response.status === 404) {
      console.warn(`⚠️ No forecast found for storm ${stormId}`);
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching latest forecast:', error);
    throw error;
  }
}

/**
 * Fetch all forecasts for a storm
 */
export async function getForecastsByStorm(
  stormId: string,
  skip: number = 0,
  limit: number = 100
): Promise<Forecast[]> {
  try {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    const response = await fetch(
      `/api/forecasts/storm/${stormId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch forecasts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching forecasts:', error);
    throw error;
  }
}

/**
 * Create a new forecast
 */
export async function createForecast(
  stormId: string,
  nchmf?: ForecastData,
  jtwc?: ForecastData
): Promise<Forecast> {
  try {
    const response = await fetch(`/api/forecasts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storm_id: stormId,
        nchmf,
        jtwc
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create forecast: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error creating forecast:', error);
    throw error;
  }
}

/**
 * Update an existing forecast
 */
export async function updateForecast(
  forecastId: number,
  nchmf?: ForecastData,
  jtwc?: ForecastData
): Promise<Forecast> {
  try {
    const response = await fetch(`/api/forecasts/${forecastId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nchmf,
        jtwc
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update forecast: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error updating forecast:', error);
    throw error;
  }
}
