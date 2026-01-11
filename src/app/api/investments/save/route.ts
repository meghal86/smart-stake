/**
 * POST /api/investments/save - Save/bookmark functionality
 * 
 * Thin API layer that calls the investments-save Edge Function
 * Requirements: 12.1, 12.4, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { data, error } = await supabase.functions.invoke('investments-save', {
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
            message: 'Failed to save investment',
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
    const kind = searchParams.get('kind');
    const limit = searchParams.get('limit');

    // Build query string for Edge Function
    const queryString = new URLSearchParams();
    if (kind) queryString.set('kind', kind);
    if (limit) queryString.set('limit', limit);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      `investments-save?${queryString.toString()}`,
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
            message: 'Failed to fetch investments',
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
    const kind = searchParams.get('kind');
    const ref_id = searchParams.get('ref_id');

    if (!kind || !ref_id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Both kind and ref_id query parameters are required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Build query string for Edge Function
    const queryString = new URLSearchParams();
    queryString.set('kind', kind);
    queryString.set('ref_id', ref_id);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      `investments-save?${queryString.toString()}`,
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
            message: 'Failed to delete investment',
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