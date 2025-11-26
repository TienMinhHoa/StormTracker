import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://118.70.181.146:58888/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stormId: string }> }
) {
  try {
    const { stormId } = await params;

    const response = await fetch(
      `${API_BASE_URL}/forecasts/storm/${stormId}/latest`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch forecast: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
