import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Lấy tất cả query params
  const queryString = searchParams.toString();
  
  // GeoServer URL từ env
  const geoserverUrl = process.env.NEXT_PUBLIC_GEOSERVER_URL || 'http://localhost:8080/geoserver/wms';
  
  try {
    const fullUrl = `${geoserverUrl}?${queryString}`;
    console.log('🔗 Proxying to:', fullUrl);
    
    // Forward request tới GeoServer
    const geoserverResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/png,image/*;q=0.8,*/*;q=0.5',
      },
    });

    console.log('📡 GeoServer response:', {
      status: geoserverResponse.status,
      statusText: geoserverResponse.statusText,
      contentType: geoserverResponse.headers.get('content-type'),
      contentLength: geoserverResponse.headers.get('content-length')
    });

    if (!geoserverResponse.ok) {
      const errorText = await geoserverResponse.text();
      console.error('❌ GeoServer error:', errorText);
      return NextResponse.json(
        { error: 'GeoServer error', details: errorText },
        { status: geoserverResponse.status }
      );
    }

    // Lấy image data
    const imageBuffer = await geoserverResponse.arrayBuffer();
    const contentType = geoserverResponse.headers.get('content-type') || 'image/png';
    
    console.log('✅ Image buffer size:', imageBuffer.byteLength);

    // Trả về với CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // Trả về transparent PNG 1x1 pixel như fallback
    const transparentPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

