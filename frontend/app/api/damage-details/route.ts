import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888';
console.log('🔧 Backend URL for damage-details route:', BACKEND_URL);
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';

    const url = `${BACKEND_URL}/api/v1/damage-details?skip=${skip}&limit=${limit}`;
    console.log('🔄 Proxying GET all damage-details:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch damage details' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.length} damage detail records`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in damage-details API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
