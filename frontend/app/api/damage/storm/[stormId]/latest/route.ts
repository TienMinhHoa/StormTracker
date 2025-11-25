import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://118.70.181.146:58888';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stormId: string }> }
) {
  try {
    const { stormId } = await params;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/damage/storm/${stormId}/latest`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching latest damage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest damage data' },
      { status: 500 }
    );
  }
}
