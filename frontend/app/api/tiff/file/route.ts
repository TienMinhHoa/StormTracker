import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const GFS_BASE_PATH = '/home/geoai/hoa/GFS_process';

/**
 * API endpoint để serve TIFF files
 * GET /api/tiff/file?component=u&year=2025&month=11&day=28&file=20251128_0000.tif
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const component = searchParams.get('component'); // 'u' or 'v'
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');
    const file = searchParams.get('file');

    // Validate parameters
    if (!component || !year || !month || !day || !file) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (component !== 'u' && component !== 'v') {
      return NextResponse.json(
        { error: 'Invalid component. Must be "u" or "v"' },
        { status: 400 }
      );
    }

    // Validate filename pattern to prevent directory traversal
    if (!/^[0-9]{8}_[0-9]{4}\.tif$/.test(file)) {
      return NextResponse.json(
        { error: 'Invalid filename format' },
        { status: 400 }
      );
    }

    // Construct file path
    const componentPath = component.toUpperCase();
    const filePath = path.join(GFS_BASE_PATH, componentPath, year, month, day, file);

    // Check if file exists and is within allowed directory
    if (!filePath.startsWith(GFS_BASE_PATH)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }

    try {
      // Read file
      const fileBuffer = await fs.readFile(filePath);

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/tiff',
          'Content-Disposition': `inline; filename="${file}"`,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });

    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ Error serving TIFF file:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
