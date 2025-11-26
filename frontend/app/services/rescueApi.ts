/**
 * Rescue API Service
 * Uses Next.js API routes to proxy requests (avoid CORS)
 */

export interface RescueRequestCreate {
  storm_id: string;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lon: number;
  priority: number; // 1-5: 1=highest priority
  status: string; // "pending", "in_progress", "completed"
  type: string; // "emergency"
  people_detail?: Record<string, any>;
  verified?: boolean;
  note?: string;
}

export interface RescueRequestResponse {
  request_id: number;
  storm_id: string;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lon: number;
  priority: number;
  status: string;
  type: string;
  people_detail?: Record<string, any>;
  verified: boolean;
  note?: string;
  created_at: string;
  updated_at?: string;
}

export interface RescueRequestUpdate {
  name?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lon?: number;
  priority?: number;
  status?: string;
  type?: string;
  people_detail?: Record<string, any>;
  verified?: boolean;
  note?: string;
}

/**
 * Create a new rescue request
 */
export async function createRescueRequest(
  request: RescueRequestCreate
): Promise<RescueRequestResponse> {
  try {
    const response = await fetch('/api/rescue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to create rescue request: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Rescue request created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating rescue request:', error);
    throw error;
  }
}

/**
 * Get rescue requests by storm ID
 */
export async function getRescueRequestsByStorm(
  stormId: string,
  skip: number = 0,
  limit: number = 100
): Promise<RescueRequestResponse[]> {
  try {
    const response = await fetch(`/api/rescue/storm/${stormId}?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch rescue requests: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.length} rescue requests for storm ${stormId}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching rescue requests for storm ${stormId}:`, error);
    return [];
  }
}

/**
 * Update a rescue request
 */
export async function updateRescueRequest(
  requestId: number,
  update: RescueRequestUpdate
): Promise<RescueRequestResponse> {
  try {
    const response = await fetch(`/api/rescue/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update rescue request: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Rescue request updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating rescue request:', error);
    throw error;
  }
}

