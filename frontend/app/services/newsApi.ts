/**
 * News API Service
 * Uses Next.js API routes to proxy requests (avoid CORS)
 */

export interface News {
  news_id: number;
  storm_id: string;
  title: string;
  content: string;
  source_url: string;
  published_at: string;
  lat: number;
  lon: number;
  thumbnail_url: string;
  category: string;
}

/**
 * Get news for a specific storm
 */
export async function getNewsByStorm(
  stormId: string,
  skip: number = 0,
  limit: number = 100
): Promise<News[]> {
  try {
    const response = await fetch(
      `/api/news/storm/${stormId}?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching news for storm ${stormId}:`, error);
    throw error;
  }
}

/**
 * Get rescue-related news for a specific storm
 * Filters news with category 'Ho_tro_Cuu_tro'
 */
export async function getRescueNewsByStorm(
  stormId: string,
  skip: number = 0,
  limit: number = 100
): Promise<News[]> {
  try {
    const response = await fetch(
      `/api/news/storm/${stormId}?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter only rescue-related news (category: Ho_tro_Cuu_tro)
    const rescueNews = data.filter((news: News) => 
      news.category === 'Ho_tro_Cuu_tro'
    );
    
    console.log(`✅ Filtered ${rescueNews.length} rescue news from ${data.length} total news`);
    return rescueNews;
  } catch (error) {
    console.error(`❌ Error fetching rescue news for storm ${stormId}:`, error);
    return [];
  }
}




