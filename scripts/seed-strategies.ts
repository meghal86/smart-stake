/**
 * Admin Seed Script: Strategies Module
 * 
 * Seeds 5+ strategies linking to existing opportunities
 * Run with: npm run seed:strategies
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch opportunity IDs by type and protocol for linking in strategies
 */
async function getOpportunityIds() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, type, protocol, title')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('❌ Failed to fetch opportunities:', error);
    return { airdrops: [], quests: [], yield: [], points: [], rwa: [] };
  }

  return {
    airdrops: data.filter((o) => o.type === 'airdrop').slice(0, 5),
    quests: data.filter((o) => o.type === 'quest').slice(0, 5),
    yield: data.filter((o) => o.type === 'staking' || o.type === 'yield').slice(0, 5),
    points: data.filter((o) => o.type === 'points').slice(0, 5),
    rwa: data.filter((o) => o.type === 'rwa').slice(0, 5),
  };
}

/**
 * Compute trust score by aggregating opportunity trust scores
 */
function computeTrustScore(opportunities: any[]): {
  trust_score_cached: number;
  steps_trust_breakdown: number[];
} {
  const steps_trust_breakdown = opportunities.map((opp) => opp.trust_score || 80);
  const trust_score_cached =
    steps_trust_breakdown.reduce((sum, score) => sum + score, 0) /
    steps_trust_breakdown.length;

  return {
    trust_score_cached: Math.round(trust_score_cached),
    steps_trust_breakdown,
  };
}

async function seedStrategies() {
  console.log('🌱 Seeding strategies...\n');

  // Fetch existing opportunities to link
  const opps = await getOpportunityIds();

  if (
    opps.airdrops.length === 0 &&
    opps.quests.length === 0 &&
    opps.yield.length === 0
  ) {
    console.error(
      '❌ No opportunities found. Please run seed scripts for other modules first.'
    );
    process.exit(1);
  }

  // Create a system user for admin-created strategies
  const { data: systemUser, error: userError } = await supabase.auth.admin.listUsers();
  
  let creatorId: string;
  if (userError || !systemUser || systemUser.users.length === 0) {
    console.log('⚠️  No users found. Creating system user for strategies...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'system@alphawhale.io',
      email_confirm: true,
      user_metadata: { name: 'AlphaWhale System' },
    });
    
    if (createError || !newUser.user) {
      console.error('❌ Failed to create system user:', createError);
      process.exit(1);
    }
    creatorId = newUser.user.id;
  } else {
    creatorId = systemUser.users[0].id;
  }

  const strategies = [
    {
      slug: 'airdrop-farming-101',
      title: 'Airdrop Farming 101',
      description:
        'Complete beginner strategy for maximizing airdrop eligibility. Follow these steps to qualify for multiple airdrops.',
      creator_id: creatorId,
      steps: opps.airdrops.slice(0, 3).map((o) => o.id),
      category: ['airdrops', 'beginner'],
      tags: ['airdrops', 'farming', 'beginner'],
      featured: true,
    },
    {
      slug: 'defi-yield-maximizer',
      title: 'DeFi Yield Maximizer',
      description:
        'Advanced strategy combining high-yield staking opportunities across multiple chains. Optimize your returns with this curated selection.',
      creator_id: creatorId,
      steps: opps.yield.slice(0, 4).map((o) => o.id),
      category: ['yield', 'advanced'],
      tags: ['yield', 'staking', 'defi', 'advanced'],
      featured: true,
    },
    {
      slug: 'quest-completion-speedrun',
      title: 'Quest Completion Speedrun',
      description:
        'Complete these quests in order to maximize XP and rewards. Estimated time: 2-3 hours.',
      creator_id: creatorId,
      steps: opps.quests.slice(0, 5).map((o) => o.id),
      category: ['quests', 'intermediate'],
      tags: ['quests', 'xp', 'rewards', 'speedrun'],
      featured: false,
    },
    {
      slug: 'points-accumulation-strategy',
      title: 'Points Accumulation Strategy',
      description:
        'Accumulate points across multiple loyalty programs. These points often convert to airdrops or token rewards.',
      creator_id: creatorId,
      steps: opps.points.slice(0, 3).map((o) => o.id),
      category: ['points', 'beginner'],
      tags: ['points', 'loyalty', 'accumulation'],
      featured: false,
    },
    {
      slug: 'institutional-rwa-portfolio',
      title: 'Institutional RWA Portfolio',
      description:
        'Diversified RWA portfolio for institutional investors. Includes treasury, credit, and real estate exposure.',
      creator_id: creatorId,
      steps: opps.rwa.slice(0, 4).map((o) => o.id),
      category: ['rwa', 'advanced'],
      tags: ['rwa', 'institutional', 'diversified'],
      featured: false,
    },
    {
      slug: 'complete-beginner-path',
      title: 'Complete Beginner Path',
      description:
        'Start here if you\'re new to crypto opportunities. This strategy combines easy quests, low-risk yield, and beginner-friendly airdrops.',
      creator_id: creatorId,
      steps: [
        ...(opps.quests.length > 0 ? [opps.quests[0].id] : []),
        ...(opps.yield.length > 0 ? [opps.yield[0].id] : []),
        ...(opps.airdrops.length > 0 ? [opps.airdrops[0].id] : []),
      ].filter(Boolean),
      category: ['beginner', 'mixed'],
      tags: ['beginner', 'onboarding', 'mixed'],
      featured: true,
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const strategy of strategies) {
    try {
      // Skip if no steps
      if (strategy.steps.length === 0) {
        console.log(`⏭️  Skipping ${strategy.title} (no opportunities available)`);
        continue;
      }

      // Fetch opportunities to compute trust score
      const { data: stepOpps, error: stepsError } = await supabase
        .from('opportunities')
        .select('id, trust_score')
        .in('id', strategy.steps);

      if (stepsError || !stepOpps) {
        console.error(`❌ Failed to fetch steps for ${strategy.title}:`, stepsError);
        errorCount++;
        continue;
      }

      // Compute trust score
      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(stepOpps);

      const { error } = await supabase.from('strategies').upsert(
        {
          ...strategy,
          trust_score_cached,
          steps_trust_breakdown,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          onConflict: 'slug',
        }
      );

      if (error) {
        console.error(`❌ Failed to seed ${strategy.title}:`, error.message);
        errorCount++;
      } else {
        console.log(
          `✅ Seeded: ${strategy.title} (${strategy.steps.length} steps, trust: ${trust_score_cached})`
        );
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${strategy.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount} strategies`);
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} strategies`);
  }
}

seedStrategies()
  .then(() => {
    console.log('\n✅ Strategy seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Strategy seeding failed:', error);
    process.exit(1);
  });
