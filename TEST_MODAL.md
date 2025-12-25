# Test Modal Opening

Open browser console and run:

```javascript
// Check if button exists
document.querySelector('button:has-text("Start Harvest")')

// Check modal state
const cards = document.querySelectorAll('[class*="HarvestOpportunityCard"]');
console.log('Cards found:', cards.length);

// Check if modal wrapper exists
const modals = document.querySelectorAll('[class*="fixed inset-0"]');
console.log('Modal wrappers:', modals.length);

// Force open modal
window.testModal = () => {
  const event = new MouseEvent('click', { bubbles: true });
  const btn = document.querySelector('button');
  if (btn && btn.textContent.includes('Start Harvest')) {
    btn.click();
    console.log('Button clicked');
  }
};

// Run test
window.testModal();
```

Check console for:
1. "🚀 Start Harvest clicked!"
2. "📦 Found opportunity:"
3. "✅ Modal should open now"

If you see these logs but no modal, the issue is CSS/rendering.
If you don't see these logs, the button click isn't working.
