/**
 * Damage API Service
 * Uses Next.js API routes to proxy requests (avoid CORS)
 */

export interface DamageCasualties {
  deaths: number | null;
  missing: number | null;
  injured: number | null;
}

export interface DamageProperty {
  houses_damaged: number | null;
  houses_flooded: number | null;
  boats_damaged: number | null;
  description: string | null;
}

export interface DamageInfrastructure {
  roads_damaged: number | null;
  schools_damaged: number | null;
  hospitals_damaged: number | null;
  description: string | null;
}

export interface DamageAgriculture {
  crop_area_damaged_ha: number | null;
  livestock_lost: number | null;
  aquaculture_damaged_ha: number | null;
  description: string | null;
}

export interface DamageSource {
  name: string;
  url?: string;
}

// Helper to normalize sources from backend (can be string[] or DamageSource[])
export function normalizeSources(sources: any): DamageSource[] {
  if (!sources || !Array.isArray(sources)) return [];
  
  return sources.map((source, index) => {
    // If already an object with name/url
    if (typeof source === 'object' && source.name) {
      return source;
    }
    // If it's a URL string
    if (typeof source === 'string') {
      // Extract domain name from URL for display
      try {
        const url = new URL(source);
        const domain = url.hostname.replace('www.', '');
        return {
          name: domain,
          url: source
        };
      } catch {
        // If not a valid URL, use as-is
        return {
          name: source,
          url: source
        };
      }
    }
    // Fallback
    return {
      name: `Nguồn ${index + 1}`,
      url: String(source)
    };
  });
}

export interface DamageDetail {
  casualties: DamageCasualties;
  property: DamageProperty;
  infrastructure: DamageInfrastructure;
  agriculture: DamageAgriculture;
  total_economic_loss_vnd: number | null;
  summary: string | null;
  sources: DamageSource[];
}

export interface DamageAssessment {
  id: number;
  storm_id: string;
  location_name: string | null;
  detail: DamageDetail;
  time: string;
  created_at: string;
  updated_at: string;
}

export async function getDamageByStorm(
  stormId: string,
  skip: number = 0,
  limit: number = 100
): Promise<DamageAssessment[]> {
  try {
    const response = await fetch(
      `/api/damage/storm/${stormId}?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch damage data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching damage for storm ${stormId}:`, error);
    return [];
  }
}

export async function getLatestDamageByStorm(stormId: string): Promise<DamageAssessment | null> {
  try {
    const response = await fetch(
      `/api/damage/storm/${stormId}/latest`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch latest damage: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching latest damage for storm ${stormId}:`, error);
    return null;
  }
}

export async function getAllDamage(
  skip: number = 0,
  limit: number = 100
): Promise<DamageAssessment[]> {
  try {
    const response = await fetch(
      `/api/damage/?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch all damage data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching all damage assessments:', error);
    return [];
  }
}
