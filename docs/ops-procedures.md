# 🔐 Operations Procedures - WhalePlus

## Secret Rotation Policy

### **Supabase Secrets Rotation (Every 90 Days)**

#### **Scheduled Rotation Dates**
- **Q1 2025**: March 31, 2025
- **Q2 2025**: June 30, 2025  
- **Q3 2025**: September 30, 2025
- **Q4 2025**: December 31, 2025

#### **Rotation Checklist**

**1. Pre-Rotation (1 week before)**
- [ ] Schedule maintenance window (low-traffic period)
- [ ] Backup current secrets to secure vault
- [ ] Notify team of upcoming rotation
- [ ] Prepare rollback procedures

**2. Rotation Day**
- [ ] Generate new service role key in Supabase Dashboard
- [ ] Update Edge Function secrets:
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY="new_key_here"
  supabase secrets set STRIPE_SECRET_KEY="current_stripe_key"
  supabase secrets set STRIPE_WEBHOOK_SECRET="current_webhook_secret"
  ```
- [ ] Update environment variables in deployment platform
- [ ] Test all Edge Functions with new keys
- [ ] Verify health endpoint responds correctly

**3. Post-Rotation (24 hours after)**
- [ ] Monitor error rates and performance metrics
- [ ] Confirm all integrations working (Stripe, external APIs)
- [ ] Update documentation with new rotation date
- [ ] Revoke old service role key in Supabase
- [ ] Archive old secrets securely

#### **Emergency Rotation Procedure**

**If secrets are compromised:**
1. **Immediate**: Revoke compromised keys in Supabase Dashboard
2. **Within 1 hour**: Generate and deploy new keys
3. **Within 4 hours**: Complete security audit and incident report
4. **Within 24 hours**: Review access logs and notify stakeholders

#### **Verification Commands**

```bash
# Test health endpoint with new keys
curl https://your-project.supabase.co/functions/v1/ops-health

# Verify BI dashboard access
curl -H "Authorization: Bearer NEW_KEY" \
  https://your-project.supabase.co/functions/v1/bi-summary

# Test scenario simulation
curl -H "Authorization: Bearer NEW_KEY" \
  https://your-project.supabase.co/functions/v1/scenario-simulate \
  -d '{"inputs":{"asset":"ETH","timeframe":"6h"}}'
```

#### **Rollback Procedure**

If issues arise after rotation:
1. **Restore previous service role key** from secure backup
2. **Update Edge Function secrets** with previous values
3. **Verify system functionality** with health checks
4. **Document incident** and plan remediation
5. **Schedule new rotation** within 7 days

### **Access Key Management**

#### **Key Types & Rotation Schedule**
- **Supabase Service Role**: 90 days (automated)
- **Stripe API Keys**: 180 days (manual)
- **OAuth Client Secrets**: 365 days (manual)
- **Database Passwords**: 90 days (automated)

#### **Security Best Practices**
- All secrets stored in Supabase Vault (encrypted at rest)
- No secrets in code repositories or environment files
- Principle of least privilege for all service accounts
- Regular access audits and unused key cleanup
- Multi-factor authentication for all admin accounts

### **Monitoring & Alerting**

#### **Automated Checks**
- Daily health endpoint validation
- Weekly secret expiration monitoring  
- Monthly access pattern analysis
- Quarterly security audit reports

#### **Alert Thresholds**
- **Critical**: Secret expires in < 7 days
- **Warning**: Secret expires in < 30 days
- **Info**: Successful rotation completed

---

**Last Updated**: January 22, 2025  
**Next Review**: April 22, 2025  
**Owner**: WhalePlus Operations Team