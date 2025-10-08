# 🧪 Test Signals Feed

## Step 1: Enable Realtime

Run in **Supabase SQL Editor**:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE whale_digest;
```

Or use the file:
```bash
# Copy contents of ENABLE_REALTIME.sql and run in Supabase
```

## Step 2: Start Dev Server

```bash
npm run dev
```

## Step 3: Navigate to Signals

Open: **http://localhost:3000/signals**

## Step 4: Verify Feed

You should see:
- ✅ "Live" indicator (green) in top-right
- ✅ Existing whale_digest events in feed
- ✅ Infinite scroll works (if you have 50+ events)
- ✅ Filter bar at top

If no data:
- Shows "No whale moves yet" message
- Check: `SELECT COUNT(*) FROM whale_digest;` in Supabase

## Step 5: Test Realtime (Optional)

Insert a test event in Supabase SQL Editor:

```sql
INSERT INTO whale_digest (event_time, asset, summary, severity, source)
VALUES (NOW(), 'BTC', 'Large whale movement detected', 4, 'test');
```

Should appear in feed within 1 second!

## Step 6: Test Filters

1. Click "Filters" button
2. Enter minimum amount: 1000000
3. Select directions: outflow, distribution
4. Verify feed updates

## Troubleshooting

### "Live" shows as "Offline"
- Check realtime is enabled: `ENABLE_REALTIME.sql`
- Check Supabase project is running
- Check browser console for errors

### No data showing
```sql
-- Check if table has data
SELECT COUNT(*) FROM whale_digest;

-- Insert test data
INSERT INTO whale_digest (event_time, asset, summary, severity, source)
VALUES 
  (NOW(), 'ETH', 'Whale moved 1000 ETH', 5, 'whale_alert'),
  (NOW() - INTERVAL '1 hour', 'BTC', 'Exchange outflow detected', 4, 'whale_alert'),
  (NOW() - INTERVAL '2 hours', 'USDT', 'Large transfer', 3, 'whale_alert');
```

### API errors
- Check `/api/signals` endpoint works
- Open browser DevTools → Network tab
- Look for 200 response from `/api/signals?limit=50`

## ✅ Success Criteria

- [ ] Feed loads existing events
- [ ] "Live" indicator shows green
- [ ] Infinite scroll works
- [ ] Filters work
- [ ] New events appear in realtime (if inserted)
- [ ] No console errors

## 🎯 Next Steps

Once working:
- Add to navigation menu
- Customize impact scoring weights
- Add user feedback buttons
- Connect to alert creation
