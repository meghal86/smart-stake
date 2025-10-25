/**
 * Fix RainbowKit modal clickability issues
 * This ensures all RainbowKit modals and buttons are always clickable
 */

export function fixRainbowKitModals() {
  // Run immediately
  applyFixes();

  // Watch for new modals
  const observer = new MutationObserver(() => {
    applyFixes();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

function applyFixes() {
  // Find all RainbowKit elements
  const rkElements = document.querySelectorAll('[data-rk]');
  
  rkElements.forEach((element) => {
    // Force pointer events on the container - ULTRA AGGRESSIVE
    if (element instanceof HTMLElement) {
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.style.setProperty('z-index', '999999', 'important');
      
      // Apply to ALL descendants
      const allDescendants = element.querySelectorAll('*');
      allDescendants.forEach((desc) => {
        if (desc instanceof HTMLElement) {
          desc.style.setProperty('pointer-events', 'auto', 'important');
        }
      });
    }

    // Fix all buttons - ULTRA AGGRESSIVE
    const buttons = element.querySelectorAll('button, a, [role="button"]');
    buttons.forEach((button) => {
      if (button instanceof HTMLElement) {
        button.style.setProperty('pointer-events', 'auto', 'important');
        button.style.setProperty('cursor', 'pointer', 'important');
        button.style.setProperty('z-index', '999999', 'important');
        button.removeAttribute('disabled');
        button.style.setProperty('user-select', 'none', 'important');
        button.style.setProperty('-webkit-user-select', 'none', 'important');
        
        // Add debug click listener
        if (!button.dataset.clickDebugAdded) {
          button.addEventListener('click', (e) => {
            console.log('🎯 Button clicked!', {
              text: button.textContent?.trim().substring(0, 50),
              testId: button.getAttribute('data-testid'),
              ariaLabel: button.getAttribute('aria-label'),
            });
          }, { capture: true });
          button.dataset.clickDebugAdded = 'true';
        }
        
        // Make child elements pass-through (don't intercept clicks)
        const children = button.querySelectorAll('*');
        children.forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('pointer-events', 'none', 'important');
          }
        });
      }
    });

    // Fix all clickable elements
    const clickables = element.querySelectorAll('[data-testid], [data-testid*="wallet"], [data-testid*="rk"]');
    clickables.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('cursor', 'pointer', 'important');
        el.style.setProperty('z-index', '999999', 'important');
      }
    });

    // Fix dialog
    const dialogs = element.querySelectorAll('[role="dialog"]');
    dialogs.forEach((dialog) => {
      if (dialog instanceof HTMLElement) {
        dialog.style.setProperty('pointer-events', 'auto', 'important');
        dialog.style.setProperty('z-index', '999999', 'important');
        dialog.style.setProperty('position', 'fixed', 'important');
        
        // Apply to all dialog children
        const dialogChildren = dialog.querySelectorAll('*');
        dialogChildren.forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('pointer-events', 'auto', 'important');
          }
        });
      }
    });
    
    // Fix backdrop
    const backdrop = element.querySelector(':scope > div:first-child');
    if (backdrop instanceof HTMLElement) {
      backdrop.style.setProperty('pointer-events', 'auto', 'important');
      backdrop.style.setProperty('z-index', '999998', 'important');
      backdrop.style.setProperty('position', 'fixed', 'important');
    }
  });

  // Also check for any overlays that might be blocking
  const allDivs = document.querySelectorAll('div');
  allDivs.forEach((div) => {
    const zIndex = window.getComputedStyle(div).zIndex;
    if (zIndex && parseInt(zIndex) > 999900 && parseInt(zIndex) < 999999) {
      // Might be blocking RainbowKit, lower its z-index
      if (div instanceof HTMLElement && !div.hasAttribute('data-rk') && !div.closest('[data-rk]')) {
        div.style.setProperty('z-index', '100', 'important');
      }
    }
  });
}

// Export a function to manually fix modals
export function forceFixRainbowKit() {
  console.log('Forcing RainbowKit modal fix...');
  
  // Check if RainbowKit modal exists
  const rkElements = document.querySelectorAll('[data-rk]');
  console.log('Found RainbowKit elements:', rkElements.length);
  
  if (rkElements.length === 0) {
    console.warn('No RainbowKit elements found in DOM!');
  } else {
    rkElements.forEach((el, index) => {
      console.log(`Element ${index}:`, {
        tagName: el.tagName,
        role: el.getAttribute('role'),
        style: (el as HTMLElement).style.cssText,
        display: window.getComputedStyle(el as HTMLElement).display,
        visibility: window.getComputedStyle(el as HTMLElement).visibility,
      });
    });
  }
  
  applyFixes();
  
  // Try again after a short delay
  setTimeout(applyFixes, 100);
  setTimeout(applyFixes, 500);
}

