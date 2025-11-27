import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: damageDetailId } = await params;
    const url = `${BACKEND_URL}/api/v1/damage-details/${damageDetailId}`;
    console.log('🔄 Proxying GET damage-detail by ID:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch damage detail' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Fetched damage detail ${damageDetailId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in damage-detail [id] API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
