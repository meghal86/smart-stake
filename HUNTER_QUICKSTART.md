# 🚀 Hunter Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install canvas-confetti @types/canvas-confetti date-fns
```

### 2. Run Database Migration
In Supabase SQL Editor:
```sql
-- Copy and paste contents of:
supabase/migrations/20251026000000_hunter_system.sql
```

### 3. Import CSS
Already imported in `Hunter.tsx`:
```tsx
import '@/styles/hunter-premium.css';
```

### 4. Start Dev Server
```bash
npm run dev
```

### 5. Navigate to Hunter
```
http://localhost:5173/hunter
```

---

## File Structure

```
New Files Created:
├── src/hooks/
│   ├── useHunterXP.ts          ✅ XP & gamification
│   └── useHunterAlerts.ts      ✅ Real-time alerts
│
├── src/components/hunter/
│   ├── HunterPremiumHeader.tsx       ✅ Header with XP bar
│   ├── HunterAIDigest.tsx            ✅ AI summary card
│   ├── HunterFilterChips.tsx         ✅ Horizontal filters
│   ├── HunterOpportunityCard.tsx     ✅ Premium quest cards
│   ├── HunterXPProgressBar.tsx       ✅ XP visualization
│   ├── HunterNotificationBell.tsx    ✅ Alerts dropdown
│   ├── HunterAIExplainability.tsx    ✅ Risk analysis modal
│   ├── HunterAchievementsModal.tsx   ✅ Badges modal
│   └── HunterLaunchAnimation.tsx     ✅ Opening animation
│
├── src/styles/
│   └── hunter-premium.css            ✅ Glassmorphic theme
│
├── supabase/migrations/
│   └── 20251026000000_hunter_system.sql  ✅ Database setup
│
└── HUNTER_WORLD_CLASS_UX.md        ✅ Full documentation
```

---

## Key Features Implemented

### ✅ Visual Design
- Glassmorphism throughout
- Premium header with search, notifications, XP
- Horizontally scrollable filters
- Glass opportunity cards with Guardian badges

### ✅ Gamification
- XP system with 10 levels
- 7 achievement badges
- Animated progress bars
- Confetti celebrations

### ✅ AI Features
- AI Digest summary block
- Guardian trust scores
- AI Explainability modal
- Plain-English risk analysis

### ✅ Real-Time Alerts
- Bell icon with unread count
- 4 alert types (new quest, expiring, reward ready, update)
- Toast notifications
- Real-time Supabase subscription

### ✅ Mobile & Desktop
- Pull-to-refresh (mobile)
- Touch feedback animations
- 3-column grid (desktop)
- Keyboard navigation

### ✅ Animations
- Framer Motion throughout
- 60 FPS smooth animations
- Launch animation (2s)
- Confetti on achievements

---

## Testing Checklist

### Visual
- [ ] Glassmorphism visible
- [ ] All animations smooth
- [ ] No layout shift
- [ ] Dark mode works

### Functional
- [ ] Filters work
- [ ] Search works
- [ ] Quest execution completes
- [ ] XP updates
- [ ] Alerts appear
- [ ] Confetti triggers

### Mobile
- [ ] Pull-to-refresh works
- [ ] Bottom nav doesn't overlap
- [ ] Touch feedback on all buttons

### Desktop
- [ ] Hover states work
- [ ] 3-column grid renders
- [ ] Keyboard navigation works

---

## Common Issues

### Issue: "canvas-confetti not found"
**Solution**: Run `npm install canvas-confetti`

### Issue: "Database function not found"
**Solution**: Run the migration in Supabase SQL Editor

### Issue: "XP not updating"
**Solution**: Ensure user is authenticated and migration ran

### Issue: "Animations laggy"
**Solution**: Check GPU acceleration enabled, reduce browser extensions

---

## Next Steps

1. ✅ **Test the experience**: Click through all features
2. ✅ **Check mobile**: Test on real device
3. ✅ **Review analytics**: Add tracking events
4. ✅ **Deploy to staging**: Test in production-like environment
5. ✅ **Gather feedback**: Show to 5-10 users

---

## Support

For detailed documentation, see `HUNTER_WORLD_CLASS_UX.md`

**Questions?** Contact the team or check the full docs.

---

**🎯 Hunter — Track, Earn, and Evolve with AlphaWhale**




