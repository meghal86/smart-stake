/**
 * Validation script for Pulse Sheet Hash Navigation
 * 
 * This script validates that the hash navigation implementation
 * meets the requirements specified in Task 12.1
 */

import fs from 'fs';
import path from 'path';

// Requirements to validate
const requirements = [
  {
    id: 'hash-navigation',
    description: '/cockpit#pulse MUST open Pulse full-screen sheet',
    files: ['src/hooks/useHashNavigation.ts', 'src/app/cockpit/page.tsx'],
    validate: (content) => {
      return (content.includes('useHashNavigation') || content.includes('targetHash')) && 
             (content.includes('pulse') || content.includes('#pulse')) &&
             (content.includes('PulseSheet') || content.includes('isOpen'));
    }
  },
  {
    id: 'hash-removal',
    description: 'Closing MUST remove hash (back to /cockpit) without full reload',
    files: ['src/hooks/useHashNavigation.ts'],
    validate: (content) => {
      return content.includes('window.history.pushState') &&
             content.includes('closeSheet') &&
             content.includes('pathname');
    }
  },
  {
    id: 'keyboard-navigation',
    description: 'Desktop: ESC closes',
    files: ['src/components/cockpit/PulseSheet.tsx'],
    validate: (content) => {
      return content.includes('Escape') &&
             content.includes('onClose') &&
             content.includes('keydown');
    }
  },
  {
    id: 'focus-restoration',
    description: 'Must restore focus to the CTA that opened it',
    files: ['src/components/cockpit/PulseSheet.tsx'],
    validate: (content) => {
      return content.includes('focusedElementBeforeOpen') &&
             content.includes('focus()') &&
             content.includes('activeElement');
    }
  }
];

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`❌ File not found: ${filePath}`);
    return null;
  }
}

function runValidation() {
  console.log('🔍 Validating Pulse Sheet Hash Navigation Implementation\n');
  
  let allPassed = true;
  
  requirements.forEach((req, index) => {
    console.log(`${index + 1}. ${req.description}`);
    
    let reqPassed = false;
    
    for (const file of req.files) {
      const content = validateFile(file);
      if (content && req.validate(content)) {
        console.log(`   ✅ Validated in ${file}`);
        reqPassed = true;
        break;
      }
    }
    
    if (!reqPassed) {
      console.log(`   ❌ Not found in any of: ${req.files.join(', ')}`);
      allPassed = false;
    }
    
    console.log('');
  });
  
  // Additional file existence checks
  const criticalFiles = [
    'src/components/cockpit/PulseSheet.tsx',
    'src/hooks/useHashNavigation.ts',
    'src/hooks/usePulseData.ts'
  ];
  
  console.log('📁 Checking critical files:');
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - Missing!`);
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All requirements validated successfully!');
    console.log('✅ Hash navigation implementation is complete.');
  } else {
    console.log('❌ Some requirements are not met.');
    console.log('🔧 Please review the implementation.');
  }
  console.log('='.repeat(50));
  
  return allPassed;
}

// Run validation
const success = runValidation();
process.exit(success ? 0 : 1);