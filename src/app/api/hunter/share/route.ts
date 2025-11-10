/**
 * Hunter Screen - Share Opportunity API
 * 
 * GET /api/hunter/share?opportunity_id=xxx
 * 
 * Generates a shareable link for an opportunity.
 * Returns metadata for social sharing (Open Graph, Twitter Cards).
 * 
 * Requirements:
 * - 5.8: Share functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema
const ShareRequestSchema = z.object({
  opportunity_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const parsed = ShareRequestSchema.safeParse({
      opportunity_id: searchParams.get('opportunity_id'),
    });
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid opportunity_id' } },
        { status: 400 }
      );
    }

    const { opportunity_id } = parsed.data;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch opportunity details
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('id, slug, title, protocol_name, protocol_logo, type, reward_min, reward_max, reward_currency, trust_score, trust_level')
      .eq('id', opportunity_id)
      .eq('status', 'published')
      .single();

    if (error || !opportunity) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Opportunity not found' } },
        { status: 404 }
      );
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alphawhale.com';
    const shareUrl = `${baseUrl}/hunter/${opportunity.slug}`;

    // Generate share text
    const rewardText = opportunity.reward_max 
      ? `${opportunity.reward_min}-${opportunity.reward_max} ${opportunity.reward_currency}`
      : 'Rewards available';
    
    const shareText = `Check out this ${opportunity.type} opportunity: ${opportunity.title} by ${opportunity.protocol_name}. ${rewardText}`;

    // Return share data
    return NextResponse.json({
      url: shareUrl,
      text: shareText,
      opportunity: {
        id: opportunity.id,
        slug: opportunity.slug,
        title: opportunity.title,
        protocol_name: opportunity.protocol_name,
        protocol_logo: opportunity.protocol_logo,
        type: opportunity.type,
        trust_level: opportunity.trust_level,
      },
      meta: {
        og_title: `${opportunity.title} - ${opportunity.protocol_name}`,
        og_description: shareText,
        og_image: opportunity.protocol_logo || `${baseUrl}/og-default.png`,
        og_url: shareUrl,
        twitter_card: 'summary_large_image',
        twitter_title: `${opportunity.title} - ${opportunity.protocol_name}`,
        twitter_description: shareText,
        twitter_image: opportunity.protocol_logo || `${baseUrl}/og-default.png`,
      },
    });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
