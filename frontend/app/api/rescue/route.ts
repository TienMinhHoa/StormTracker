import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://118.70.181.146:58888/api/v1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📡 Creating rescue request:', body);

    const response = await fetch(`${API_BASE_URL}/rescue/`, {
      method: 'POST',
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
          error: 'Failed to create rescue request',
          message: errorText || `${response.status} ${response.statusText}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Rescue request created successfully:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌ Error in rescue API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create rescue request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

