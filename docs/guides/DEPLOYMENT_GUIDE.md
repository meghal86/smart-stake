# 🚀 AlphaWhale Lite Deployment Guide

This guide will walk you through deploying the complete AlphaWhale Lite application to production.

## Prerequisites

- Vercel account
- Supabase account
- GitHub repository

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 1.2 Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 1.3 Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy ingest_whale_index
supabase functions deploy ingest_unlocks
supabase functions deploy notify_streak
```

### 1.4 Set up Cron Jobs

In your Supabase dashboard:
1. Go to Database > Functions
2. Create cron jobs for the edge functions:
   - `ingest_whale_index`: Run daily at 00:00 UTC
   - `ingest_unlocks`: Run daily at 01:00 UTC
   - `notify_streak`: Run daily at 09:00 UTC

### 1.5 Seed the Database

```bash
# Run the seed script
npm run db:seed
```

## Step 2: Vercel Deployment

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select the project folder

### 2.2 Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2.3 Deploy

1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Test your live application

## Step 3: Post-Deployment Setup

### 3.1 Configure Supabase Auth

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to allowed origins
3. Set redirect URLs:
   - `https://your-domain.vercel.app/hub`
   - `https://your-domain.vercel.app/auth/callback`

### 3.2 Set up OAuth Providers (Optional)

1. Go to Authentication > Providers
2. Enable Google OAuth
3. Add your Google OAuth credentials

### 3.3 Configure RLS Policies

The RLS policies are already set up in the migration, but verify they're working:

```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'whale_digest', 'whale_index', 'token_unlocks');
```

## Step 4: Testing

### 4.1 Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### 4.2 Manual Testing

1. **Authentication Flow**:
   - Sign up with email
   - Sign in with Google
   - Test password reset

2. **Hub Page**:
   - Verify all cards load
   - Test responsive design
   - Check navigation

3. **API Endpoints**:
   - Test `/api/digest`
   - Test `/api/whale-index`
   - Test `/api/unlocks`
   - Test `/api/streak`

4. **Database**:
   - Verify data is seeded
   - Check RLS policies
   - Test user profile creation

## Step 5: Monitoring

### 5.1 Set up Monitoring

1. **Vercel Analytics**: Enable in Vercel dashboard
2. **Supabase Monitoring**: Check logs in Supabase dashboard
3. **Error Tracking**: Consider adding Sentry

### 5.2 Set up Alerts

1. **Database Alerts**: Set up alerts for database issues
2. **Function Alerts**: Monitor edge function performance
3. **API Alerts**: Set up alerts for API failures

## Step 6: Production Optimization

### 6.1 Performance

1. **Image Optimization**: Use Next.js Image component
2. **Caching**: Implement proper caching strategies
3. **CDN**: Vercel automatically provides CDN

### 6.2 Security

1. **Environment Variables**: Ensure all secrets are in environment variables
2. **CORS**: Configure CORS properly
3. **Rate Limiting**: Implement rate limiting for API routes

### 6.3 SEO

1. **Meta Tags**: Add proper meta tags
2. **Sitemap**: Generate sitemap
3. **Robots.txt**: Add robots.txt

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables
   - Verify TypeScript compilation
   - Check for missing dependencies

2. **Database Issues**:
   - Verify RLS policies
   - Check connection strings
   - Verify migrations ran

3. **Authentication Issues**:
   - Check redirect URLs
   - Verify OAuth configuration
   - Check CORS settings

### Debug Commands

```bash
# Check Supabase connection
supabase status

# View logs
supabase functions logs

# Test database connection
npm run db:test
```

## Maintenance

### Regular Tasks

1. **Database Backups**: Set up automated backups
2. **Security Updates**: Keep dependencies updated
3. **Performance Monitoring**: Monitor app performance
4. **User Feedback**: Collect and act on user feedback

### Updates

1. **Dependencies**: Update dependencies regularly
2. **Features**: Add new features based on user feedback
3. **Security**: Apply security patches promptly

## Support

If you encounter issues:

1. Check the logs in Vercel and Supabase dashboards
2. Review the troubleshooting section
3. Check GitHub issues
4. Contact support if needed

## Success Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Authentication working
- [ ] All tests passing
- [ ] Monitoring set up
- [ ] Documentation updated

Congratulations! Your AlphaWhale Lite application is now live and ready for users! 🎉