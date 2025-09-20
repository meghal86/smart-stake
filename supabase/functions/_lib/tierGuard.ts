export async function enforceTier(
  supabase: any,
  feature: 'export' | 'backtest' | 'forensics' | 'share' | 'save'
) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Authentication required');

  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('user_id', user.id)
    .single();

  const tier = userData?.plan ?? 'free';

  const requirements = {
    export: ['premium', 'enterprise'],
    backtest: ['premium', 'enterprise'],
    forensics: ['enterprise'],
    share: ['pro', 'premium', 'enterprise'],
    save: ['pro', 'premium', 'enterprise']
  }[feature];

  if (!requirements.includes(tier)) {
    throw new Error(`Upgrade required: ${feature} requires ${requirements[0]}+ subscription`);
  }

  return { userId: user.id, tier };
}

export async function checkRateLimit(
  supabase: any,
  token: string,
  ipAddress: string,
  limit: number = 100
) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('share_access_log')
    .select('*', { count: 'exact', head: true })
    .gte('accessed_at', oneHourAgo)
    .eq('token', token)
    .eq('ip_address', ipAddress);

  if ((count ?? 0) >= limit) {
    throw new Error('Rate limit exceeded: 100 requests per hour');
  }

  // Log this access
  await supabase
    .from('share_access_log')
    .insert({ token, ip_address: ipAddress });

  return true;
}