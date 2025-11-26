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

    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';

    console.log(`📡 Fetching rescue requests for storm: ${stormId}, skip=${skip}, limit=${limit}`);

    const response = await fetch(
      `${API_BASE_URL}/rescue/storm/${stormId}?skip=${skip}&limit=${limit}`,
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
      throw new Error(`Failed to fetch rescue requests: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.length} rescue requests for storm ${stormId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`❌ Error in rescue requests API route:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch rescue requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

