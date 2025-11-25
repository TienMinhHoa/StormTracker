/**
 * Warning API Service - Cảnh báo ngập lụt và sạt lở từ NCHMF
 */

const WARNING_API_URL = 'https://luquetsatlo.nchmf.gov.vn/LayerMapBox/getDSCanhbaoSLLQ';

export type RiskLevel = 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao' | '';

export interface Warning {
  id: number;
  commune_id_2cap: number;
  commune_name_2cap: string;
  commune_id: number;
  commune_name: string;
  district_name: string;
  provinceName: string;
  provinceName_2cap: string;
  province_ref: number;
  lat: number;
  lon: number;
  thoigian: string;
  luongmuatd: number;
  luongmuadb: number;
  luongmuatd_db: number;
  nguycosatlo: RiskLevel;
  nguycoluquet: RiskLevel;
  nguonmuadubao: string;
  sogiodubao: number;
  nguoi_capnhat: string;
  ngay_capnhat: string;
}

/**
 * Get current date in GMT+7 with hour rounded down
 * Format: "YYYY-MM-DD HH:00:00"
 */
function getGMT7RoundedDate(): string {
  const now = new Date();
  // Convert to GMT+7 (add 7 hours to UTC)
  const gmt7Time = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const year = gmt7Time.getUTCFullYear();
  const month = String(gmt7Time.getUTCMonth() + 1).padStart(2, '0');
  const day = String(gmt7Time.getUTCDate()).padStart(2, '0');
  const hour = String(gmt7Time.getUTCHours()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:00:00`;
}

function parseDotNetDate(dateStr: string): string {
  // Handle .NET JSON date format: /Date(timestamp)/
  const match = dateStr.match(/\/Date\((\d+)\)\//);
  if (match) {
    const timestamp = parseInt(match[1]);
    return new Date(timestamp).toISOString();
  }
  // Already in ISO format or other standard format
  return dateStr;
}

/**
 * Get warnings from NCHMF API
 */
export async function getWarnings(
  forecastHours: number = 6,
  date?: string
): Promise<Warning[]> {
  try {
    const body = {
      sogiodubao: forecastHours,
      date: date || getGMT7RoundedDate()
    };

    const response = await fetch(WARNING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch warnings: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Fetched warnings:', data, body);
    // Parse .NET date format and return
    return data.map((item: any) => ({
      ...item,
      thoigian: parseDotNetDate(item.thoigian),
      ngay_capnhat: parseDotNetDate(item.ngay_capnhat),
    }));
  } catch (error) {
    console.error('❌ Error fetching warnings:', error);
    throw error;
  }
}

/**
 * Get risk level color
 */
export function getRiskColor(level: RiskLevel): { bg: string; border: string; text: string } {
  switch (level) {
    case 'Rất cao':
      return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' };
    case 'Cao':
      return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400' };
    case 'Trung bình':
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400' };
    case 'Thấp':
      return { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400' };
    default:
      return { bg: 'bg-gray-500/10', border: 'border-gray-500', text: 'text-gray-400' };
  }
}

/**
 * Get risk level icon
 */
export function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case 'Rất cao':
      return '🔴';
    case 'Cao':
      return '🟠';
    case 'Trung bình':
      return '🟡';
    case 'Thấp':
      return '🟢';
    default:
      return '⚪';
  }
}
