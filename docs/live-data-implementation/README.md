# 🐋 AlphaWhale Lite V2 - Live Data Implementation Guide

Complete documentation for switching AlphaWhale Lite V2 from mock to live data using Supabase Edge Functions + Supabase DB.

## 📁 Documentation Structure

### Core Implementation
- [**01-environment-setup.md**](./01-environment-setup.md) - Environment variables and feature flags
- [**02-database-schema.md**](./02-database-schema.md) - Database tables and views setup
- [**03-edge-functions.md**](./03-edge-functions.md) - Supabase Edge Functions implementation
- [**04-scheduling.md**](./04-scheduling.md) - Cron jobs and automated tasks
- [**05-client-adapters.md**](./05-client-adapters.md) - Frontend adapter modifications

### Quality & Monitoring
- [**06-health-monitoring.md**](./06-health-monitoring.md) - Health checks and observability
- [**07-testing-strategy.md**](./07-testing-strategy.md) - Unit, integration, and E2E tests
- [**08-deployment-checklist.md**](./08-deployment-checklist.md) - Acceptance criteria and rollout

### Reference
- [**09-api-reference.md**](./09-api-reference.md) - Complete API documentation
- [**10-troubleshooting.md**](./10-troubleshooting.md) - Common issues and solutions

## 🎯 Implementation Goals

- **Reuse-first**: Leverage existing adapters and contracts
- **Non-destructive**: All changes are reversible
- **Idempotent**: Safe to run multiple times
- **Feature-flagged**: Behind `NEXT_PUBLIC_DATA_MODE` switch
- **Fallback-ready**: Graceful degradation to mock data

## 🚀 Quick Start

1. **Environment Setup**: Configure API keys and flags
2. **Database**: Create/reuse compatible tables
3. **Functions**: Deploy Edge Functions for data ingestion
4. **Scheduling**: Set up automated data refresh
5. **Testing**: Validate live data flow
6. **Deploy**: Feature-flagged rollout

## 📊 Data Flow

```
Alchemy/Etherscan → Edge Functions → Supabase DB → Client Adapters → UI
                                  ↓
                              Health Checks → Monitoring/Alerts
```

## 🔄 Rollback Strategy

Switch `NEXT_PUBLIC_DATA_MODE=mock` to instantly revert to existing mock data behavior.

---

**Next**: Start with [Environment Setup](./01-environment-setup.md)