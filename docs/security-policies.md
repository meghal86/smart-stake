# Security Policies & DevOps Best Practices

## 🔐 Secret Management

### Secret Rotation Schedule
- **API Keys**: Rotate every 90 days
- **Database Credentials**: Rotate every 60 days  
- **Webhook Secrets**: Rotate every 30 days
- **JWT Secrets**: Rotate every 180 days

### Rotation Process
```bash
# Run automated rotation script
./scripts/rotate-secrets.sh

# Manual verification steps
supabase functions list --linked
curl -H "Authorization: Bearer $NEW_KEY" https://api.stripe.com/v1/account
```

## 🛡️ Pre-commit Security Checks

### Setup
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

### Secret Detection Baseline
```bash
# Generate baseline for existing secrets
detect-secrets scan --baseline .secrets.baseline

# Update baseline when adding legitimate secrets
detect-secrets scan --baseline .secrets.baseline --update
```

## 🔍 Environment Security

### Required .env Variables
```bash
# Supabase (required)
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (required)
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
ALCHEMY_API_KEY=...
MORALIS_API_KEY=...
```

### Security Checklist
- [ ] All secrets in environment variables (not code)
- [ ] .env files in .gitignore
- [ ] Pre-commit hooks installed
- [ ] Secret rotation schedule documented
- [ ] Production secrets different from development
- [ ] Webhook endpoints use HTTPS only
- [ ] API keys have minimal required permissions

## 🚀 Deployment Security

### CI/CD Pipeline Secrets
```yaml
# GitHub Actions example
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### Production Checklist
- [ ] Secrets stored in secure vault (GitHub Secrets, AWS Secrets Manager)
- [ ] No secrets in container images
- [ ] Regular security scans enabled
- [ ] Monitoring for secret exposure
- [ ] Incident response plan documented

## 📊 Database Security

### RLS Policies Applied
- ✅ user_watchlists: Users can only access their own data
- ✅ alert_rules: Users can only manage their own alerts  
- ✅ alert_notifications: Users can only view their own notifications
- ✅ shared_watchlists: Public read, owner write access

### Performance Indexes
- ✅ Composite indexes on (address, chain, ts)
- ✅ Partial indexes for active/high-confidence data
- ✅ User-specific indexes for fast queries

### Query Optimization
- ✅ DTO views prevent SELECT * queries
- ✅ Proper JOIN strategies with LATERAL joins
- ✅ Index hints for complex queries

## 🔧 Monitoring & Alerting

### Security Monitoring
```sql
-- Monitor failed authentication attempts
SELECT COUNT(*) FROM auth.audit_log_entries 
WHERE event_type = 'user_signedin_failed' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Monitor suspicious API usage
SELECT user_id, COUNT(*) as request_count
FROM api_usage_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id 
HAVING COUNT(*) > 1000;
```

### Automated Alerts
- Failed authentication spikes
- Unusual API usage patterns  
- Secret rotation reminders
- Security scan failures

## 📋 Incident Response

### Security Incident Steps
1. **Immediate**: Rotate compromised secrets
2. **Assess**: Determine scope of exposure
3. **Contain**: Revoke access, update firewalls
4. **Notify**: Inform stakeholders and users
5. **Recover**: Restore secure operations
6. **Learn**: Update policies and procedures

### Emergency Contacts
- Security Team: security@company.com
- DevOps Team: devops@company.com
- Legal Team: legal@company.com