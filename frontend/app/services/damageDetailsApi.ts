/**
 * Damage Details API Service
 * For the new damage_details table with LLM-extracted location-based damage info
 */

export interface DamageContent {
  location_key: string;        // Format: "lat-lon" (e.g., "16.0680-108.2120")
  location_name: string;        // Location name (e.g., "Đà Nẵng")
  latitude: number;             // Latitude coordinate
  longitude: number;            // Longitude coordinate
  damages: {                    // Object with damage categories as keys
    [category: string]: string; // Category name -> damage description
    // Common categories: flooding, wind_damage, infrastructure, agriculture, casualties, evacuated, economic
  };
}

export interface DamageDetailRecord {
  id: number;
  storm_id: string;
  content: DamageContent;
  created_at: string;
  modified_at: string;
}

/**
 * Get all damage details for a specific storm
 */
export async function getDamageDetailsByStorm(
  stormId: string,
  skip: number = 0,
  limit: number = 100
): Promise<DamageDetailRecord[]> {
  try {
    const response = await fetch(
      `/api/damage-details/storm/${stormId}?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch damage details: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} damage detail records for storm ${stormId}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching damage details for storm ${stormId}:`, error);
    return [];
  }
}

/**
 * Get a single damage detail record by ID
 */
export async function getDamageDetailById(
  damageDetailId: number
): Promise<DamageDetailRecord | null> {
  try {
    const response = await fetch(
      `/api/damage-details/${damageDetailId}`,
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
      throw new Error(`Failed to fetch damage detail: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching damage detail ${damageDetailId}:`, error);
    return null;
  }
}

/**
 * Get all damage details (across all storms)
 */
export async function getAllDamageDetails(
  skip: number = 0,
  limit: number = 100
): Promise<DamageDetailRecord[]> {
  try {
    const response = await fetch(
      `/api/damage-details/?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch all damage details: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching all damage details:', error);
    return [];
  }
}

/**
 * Extract damage categories from all records
 */
export function extractDamageCategories(records: DamageDetailRecord[]): string[] {
  const categories = new Set<string>();
  records.forEach(record => {
    Object.keys(record.content.damages).forEach(category => {
      categories.add(category);
    });
  });
  return Array.from(categories).sort();
}

/**
 * Get damage records by category
 */
export function filterByCategory(
  records: DamageDetailRecord[],
  category: string
): DamageDetailRecord[] {
  return records.filter(record => record.content.damages[category]);
}

/**
 * Calculate total locations with casualties
 */
export function getLocationsWithCasualties(records: DamageDetailRecord[]): number {
  return records.filter(record => record.content.damages.casualties).length;
}

/**
 * Calculate total locations with economic damage
 */
export function getLocationsWithEconomicDamage(records: DamageDetailRecord[]): number {
  return records.filter(record => record.content.damages.economic).length;
}
