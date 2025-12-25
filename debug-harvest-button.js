/**
 * Debug script for HarvestPro Start Harvest button
 * Run this in the browser console on the HarvestPro page to debug issues
 */

console.log('🔍 HarvestPro Button Debug Script Started');

// Check if we're on the HarvestPro page
if (!window.location.pathname.includes('harvestpro')) {
  console.warn('⚠️ Not on HarvestPro page. Navigate to /harvestpro first.');
}

// Debug function to check button state
function debugHarvestButtons() {
  console.log('🔍 Debugging Start Harvest buttons...');
  
  // Find all Start Harvest buttons
  const buttons = document.querySelectorAll('button');
  const harvestButtons = Array.from(buttons).filter(btn => 
    btn.textContent?.includes('Start Harvest') || 
    btn.textContent?.includes('Harvest')
  );
  
  console.log(`📊 Found ${harvestButtons.length} harvest-related buttons`);
  
  harvestButtons.forEach((btn, index) => {
    console.log(`🔘 Button ${index + 1}:`, {
      text: btn.textContent?.trim(),
      disabled: btn.disabled,
      className: btn.className,
      onclick: btn.onclick ? 'Has click handler' : 'No click handler',
      parentElement: btn.parentElement?.className
    });
    
    // Add debug click listener
    btn.addEventListener('click', (e) => {
      console.log(`🖱️ Button ${index + 1} clicked!`, {
        event: e,
        target: e.target,
        currentTarget: e.currentTarget,
        disabled: btn.disabled
      });
    });
  });
}

// Debug function to check opportunities data
function debugOpportunities() {
  console.log('🔍 Debugging opportunities data...');
  
  // Try to find React component data
  const harvestCards = document.querySelectorAll('[class*="opportunity"]');
  console.log(`📊 Found ${harvestCards.length} opportunity-related elements`);
  
  // Check for React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('⚛️ React DevTools detected');
  } else {
    console.log('❌ React DevTools not found');
  }
}

// Debug function to check modal state
function debugModal() {
  console.log('🔍 Debugging modal state...');
  
  // Look for modal elements
  const modals = document.querySelectorAll('[class*="modal"], [class*="Modal"]');
  console.log(`📊 Found ${modals.length} modal elements`);
  
  modals.forEach((modal, index) => {
    console.log(`🎭 Modal ${index + 1}:`, {
      className: modal.className,
      style: modal.style.cssText,
      visible: modal.style.display !== 'none' && !modal.hidden,
      zIndex: modal.style.zIndex || getComputedStyle(modal).zIndex
    });
  });
  
  // Check for fixed positioned elements (likely modals)
  const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => 
    getComputedStyle(el).position === 'fixed'
  );
  
  console.log(`📊 Found ${fixedElements.length} fixed positioned elements (potential modals)`);
}

// Debug function to simulate button click
function simulateHarvestClick(buttonIndex = 0) {
  console.log(`🎯 Simulating click on harvest button ${buttonIndex + 1}...`);
  
  const buttons = document.querySelectorAll('button');
  const harvestButtons = Array.from(buttons).filter(btn => 
    btn.textContent?.includes('Start Harvest')
  );
  
  if (harvestButtons[buttonIndex]) {
    const btn = harvestButtons[buttonIndex];
    console.log('🖱️ Clicking button:', btn.textContent?.trim());
    
    // Dispatch multiple event types to ensure it's caught
    btn.click();
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    
    // Check if modal appeared after a delay
    setTimeout(() => {
      debugModal();
    }, 500);
  } else {
    console.error(`❌ No harvest button found at index ${buttonIndex}`);
  }
}

// Debug function to check console for errors
function checkConsoleErrors() {
  console.log('🔍 Checking for console errors...');
  
  // Override console.error to catch errors
  const originalError = console.error;
  console.error = function(...args) {
    console.log('🚨 Console Error Detected:', args);
    originalError.apply(console, args);
  };
  
  console.log('✅ Error monitoring enabled');
}

// Main debug function
function debugHarvestPro() {
  console.log('🚀 Running complete HarvestPro debug...');
  
  debugHarvestButtons();
  debugOpportunities();
  debugModal();
  checkConsoleErrors();
  
  console.log('✅ Debug complete. Use these functions:');
  console.log('- debugHarvestButtons() - Check button state');
  console.log('- debugOpportunities() - Check opportunities data');
  console.log('- debugModal() - Check modal state');
  console.log('- simulateHarvestClick(0) - Simulate button click');
}

// Auto-run debug
debugHarvestPro();

// Make functions available globally
window.debugHarvestPro = debugHarvestPro;
window.debugHarvestButtons = debugHarvestButtons;
window.debugOpportunities = debugOpportunities;
window.debugModal = debugModal;
window.simulateHarvestClick = simulateHarvestClick;

console.log('🎯 Debug functions available globally. Try: simulateHarvestClick(0)');