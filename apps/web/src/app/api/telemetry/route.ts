import { NextRequest, NextResponse } from 'next/server';

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TelemetryEvent = await request.json();
    
    if (!body.event) {
      return NextResponse.json({ error: 'Event name required' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Telemetry Event:', {
        event: body.event,
        properties: body.properties,
        timestamp: body.timestamp
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}