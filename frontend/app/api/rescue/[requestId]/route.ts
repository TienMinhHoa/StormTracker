import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://118.70.181.146:58888/api/v1';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> | { requestId: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { requestId } = resolvedParams;

    const body = await request.json();
    
    console.log(`📡 Updating rescue request ${requestId}:`, body);

    const response = await fetch(`${API_BASE_URL}/rescue/${requestId}`, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to update rescue request',
          message: errorText || `${response.status} ${response.statusText}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Rescue request updated successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error in rescue update API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update rescue request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

