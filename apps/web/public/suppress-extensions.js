// Immediately suppress extension errors before React loads
(function() {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const msg = args[0]?.toString() || '';
    if (msg.includes('chrome-extension://') || 
        msg.includes('ERR_FILE_NOT_FOUND') ||
        msg.includes('pejdijmoenmkgeppbflobdenhhabjlaj')) {
      return;
    }
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const msg = args[0]?.toString() || '';
    if (msg.includes('chrome-extension://')) {
      return;
    }
    originalWarn.apply(console, args);
  };
})();