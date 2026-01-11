/**
 * Alert Rules API Routes
 * 
 * GET /api/alerts/rules - Retrieve alert rules
 * POST /api/alerts/rules - Create alert rule
 * 
 * Thin API layer that calls the alert-rules Edge Function
 * Requirements: 12.3, 12.5, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const enabled_only = searchParams.get('enabled_only');
    const limit = searchParams.get('limit');

    // Build query string for Edge Function
    const queryString = new URLSearchParams();
    if (enabled_only) queryString.set('enabled_only', enabled_only);
    if (limit) queryString.set('limit', limit);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      `alert-rules?${queryString.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: authorization,
        },
      }
    );

    if (error) {
      console.error('Edge Function error:', error);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch alert rules',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Return the response from the Edge Function
    return NextResponse.json(data, { 
      status: data.error ? (data.error.code === 'UNAUTHORIZED' ? 401 : 400) : 200 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('alert-rules', {
      body,
      headers: {
        Authorization: authorization,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create alert rule',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Return the response from the Edge Function
    return NextResponse.json(data, { 
      status: data.error ? (data.error.code === 'UNAUTHORIZED' ? 401 : 400) : 201 
    });

  } catch (error) {
    console.error('API error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('alert-rules', {
      method: 'PUT',
      body,
      headers: {
        Authorization: authorization,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update alert rule',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Return the response from the Edge Function
    return NextResponse.json(data, { 
      status: data.error ? (data.error.code === 'UNAUTHORIZED' ? 401 : data.error.code === 'NOT_FOUND' ? 404 : 400) : 200 
    });

  } catch (error) {
    console.error('API error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'id query parameter is required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Build query string for Edge Function
    const queryString = new URLSearchParams();
    queryString.set('id', id);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      `alert-rules?${queryString.toString()}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: authorization,
        },
      }
    );

    if (error) {
      console.error('Edge Function error:', error);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete alert rule',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Return the response from the Edge Function
    return NextResponse.json(data, { 
      status: data.error ? (data.error.code === 'UNAUTHORIZED' ? 401 : 400) : 200 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}