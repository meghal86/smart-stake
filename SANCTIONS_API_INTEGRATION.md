# 🛡️ Sanctions API Integration Guide

## 🎯 **What Sanctions Screening Does**

Sanctions screening checks if a cryptocurrency wallet address appears on:
- **OFAC SDN List** (US Treasury Specially Designated Nationals)
- **EU Consolidated List** (European Union sanctions)
- **UN Security Council** sanctions lists
- **Country-specific** sanctions databases

## 📊 **Current Status: MOCK DATA**

The current implementation uses **simulated data** and always shows "SANCTIONS CLEAR" for demo purposes.

## 🔗 **Real API Integration Options**

### **Option 1: Chainalysis Sanctions API**
```typescript
// Replace in useSanctionsCheck.ts
const response = await fetch('https://api.chainalysis.com/api/kyt/v1/addresses/sanctions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CHAINALYSIS_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: address,
    asset: 'ETH'
  })
});
```

### **Option 2: Elliptic Navigator API**
```typescript
const response = await fetch('https://api.elliptic.co/v2/wallet/synchronous', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ELLIPTIC_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subject: {
      asset: 'ETH',
      hash: address
    }
  })
});
```

### **Option 3: TRM Labs API**
```typescript
const response = await fetch('https://api.trmlabs.com/public/v1/sanctions/screening', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TRM_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: address,
    asset: 'ethereum'
  })
});
```

### **Option 4: Free OFAC API (Limited)**
```typescript
const response = await fetch('https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ENHANCED_XML', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
});
```

## 🔧 **Implementation Steps**

### **1. Choose API Provider**
- **Chainalysis**: Most comprehensive, enterprise-grade
- **Elliptic**: Good coverage, compliance focused  
- **TRM Labs**: Real-time screening, good pricing
- **OFAC Direct**: Free but limited functionality

### **2. Get API Credentials**
```bash
# Add to .env file
CHAINALYSIS_API_KEY=your_api_key_here
ELLIPTIC_API_KEY=your_api_key_here
TRM_API_KEY=your_api_key_here
```

### **3. Update Hook Implementation**
```typescript
// In useSanctionsCheck.ts - replace mock section
try {
  const response = await fetch('/api/sanctions/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });

  if (!response.ok) {
    throw new Error('Sanctions check failed');
  }

  const data = await response.json();
  
  setResult({
    isLoading: false,
    isSanctioned: data.isSanctioned,
    sanctionsList: data.sanctionsList,
    lastChecked: new Date(),
    error: null
  });
} catch (error) {
  setResult({
    isLoading: false,
    isSanctioned: false,
    sanctionsList: [],
    lastChecked: null,
    error: error.message
  });
}
```

### **4. Create Backend Endpoint**
```typescript
// supabase/functions/sanctions-check/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { address } = await req.json();
  
  // Call real sanctions API
  const sanctionsResponse = await fetch('https://api.chainalysis.com/...', {
    headers: { 'Authorization': `Bearer ${Deno.env.get('CHAINALYSIS_API_KEY')}` },
    // ... API call details
  });
  
  const sanctionsData = await sanctionsResponse.json();
  
  return new Response(JSON.stringify({
    isSanctioned: sanctionsData.isSanctioned,
    sanctionsList: sanctionsData.sanctionsList,
    confidence: sanctionsData.confidence
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## 💰 **API Pricing (Approximate)**

| Provider | Free Tier | Paid Plans | Enterprise |
|----------|-----------|------------|------------|
| Chainalysis | No | $500+/month | Custom |
| Elliptic | Limited | $300+/month | Custom |
| TRM Labs | 100 calls | $200+/month | Custom |
| OFAC Direct | Yes | N/A | N/A |

## 🚨 **Important Notes**

### **Legal Compliance**
- Sanctions screening is **legally required** for many financial services
- **False negatives** can result in regulatory penalties
- **Documentation** of screening is essential for audits

### **Technical Considerations**
- **Rate limiting** - Most APIs have call limits
- **Caching** - Cache results to avoid repeated calls
- **Fallback** - Have backup screening methods
- **Monitoring** - Track API uptime and accuracy

## 🎯 **Recommended Implementation**

For production use:
1. **Start with TRM Labs** (good balance of features/cost)
2. **Implement caching** (Redis) for 24-hour result storage
3. **Add monitoring** for API health and response times
4. **Create audit logs** for all screening activities

## 🔄 **Current Demo Behavior**

Until real API is connected:
- All addresses show **"SANCTIONS CLEAR"**
- Timestamp shows **current time**
- No actual screening occurs
- **Safe for testing** but not production use

**Ready to upgrade to real sanctions screening when needed! 🛡️**