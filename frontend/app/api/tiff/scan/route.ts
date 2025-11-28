import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const GFS_BASE_PATH = '/home/geoai/hoa/GFS_process';

interface WindTimestamp {
  timestamp: string;
  uFile: string;
  vFile: string;
}

/**
 * Get thời gian hiện tại theo GMT+7
 */
function getCurrentTimeGMT7(): Date {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const gmt7Time = new Date(utcTime + (7 * 60 * 60 * 1000));
  return gmt7Time;
}

/**
 * API endpoint để quét thư mục GFS_process và trả về danh sách timestamps
 * GET /api/tiff/scan?days=7
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysToScan = parseInt(searchParams.get('days') || '7', 10);

    console.log(`🔍 Scanning GFS_process directory for last ${daysToScan} days...`);
    
    const timestamps: WindTimestamp[] = [];
    const nowGMT7 = getCurrentTimeGMT7();

    // Quét các ngày gần nhất
    for (let daysBack = 0; daysBack < daysToScan; daysBack++) {
      const targetDate = new Date(nowGMT7.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');

      const dayPath = path.join(GFS_BASE_PATH, 'U', String(year), month, day);

      try {
        // Kiểm tra xem thư mục có tồn tại không
        await fs.access(dayPath);
        
        // Đọc tất cả file trong thư mục
        const files = await fs.readdir(dayPath);
        
        // Lọc file .tif và extract timestamp
        const tifFiles = files.filter(f => f.endsWith('.tif'));
        
        for (const file of tifFiles) {
          // Parse filename: yyyymmdd_hhmm.tif
          const match = file.match(/^(\d{8})_(\d{4})\.tif$/);
          if (match) {
            const [, dateStr, timeStr] = match;
            const fileYear = dateStr.substring(0, 4);
            const fileMonth = dateStr.substring(4, 6);
            const fileDay = dateStr.substring(6, 8);
            const fileHour = timeStr.substring(0, 2);
            const fileMinute = timeStr.substring(2, 4);
            
            const displayTime = `${fileYear}-${fileMonth}-${fileDay} ${fileHour}:${fileMinute}`;
            const uPath = `/api/tiff/file?component=u&year=${fileYear}&month=${fileMonth}&day=${fileDay}&file=${file}`;
            const vPath = `/api/tiff/file?component=v&year=${fileYear}&month=${fileMonth}&day=${fileDay}&file=${file}`;
            
            timestamps.push({
              timestamp: displayTime,
              uFile: uPath,
              vFile: vPath
            });
          }
        }
      } catch (error) {
        // Thư mục không tồn tại, bỏ qua
        continue;
      }
    }

    // Sắp xếp theo thời gian (cũ nhất lên đầu)
    timestamps.sort((a, b) => {
      const dateA = new Date(a.timestamp.replace(' ', 'T'));
      const dateB = new Date(b.timestamp.replace(' ', 'T'));
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`✅ Found ${timestamps.length} TIFF files`);

    return NextResponse.json({
      success: true,
      count: timestamps.length,
      timestamps
    });

  } catch (error) {
    console.error('❌ Error scanning TIFF files:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan TIFF files',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
