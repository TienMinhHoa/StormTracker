import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://118.70.181.146:58888/api/v1';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stormId: string }> | { stormId: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { stormId } = resolvedParams;

    console.log(`📡 Fetching tracks for storm: ${stormId}`);

    const response = await fetch(
      `${API_BASE_URL}/storms/${stormId}/tracks`,
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
      throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.length} tracks for storm ${stormId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`❌ Error in tracks API route:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tracks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

