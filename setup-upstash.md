# Upstash Redis Setup

## 1. Create Upstash Account
- Go to https://upstash.com/
- Sign up/login with GitHub

## 2. Create Redis Database
- Click "Create Database"
- Choose region closest to your users
- Select "Global" for multi-region
- Copy the Redis URL

## 3. Add to Environment
```bash
# Add to .env.local
UPSTASH_REDIS_URL=rediss://default:your_password@your_endpoint.upstash.io:6380
```

## 4. Test Connection
```bash
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.UPSTASH_REDIS_URL);
redis.ping().then(console.log).catch(console.error);
"
```