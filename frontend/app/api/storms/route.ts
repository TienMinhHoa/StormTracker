import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('🔧 Backend URL for damage route:', API_BASE_URL);
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';

    console.log(`📡 Fetching storms: skip=${skip}, limit=${limit}`);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/storms/?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch storms: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.length} storms`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in storms API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch storms',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

