// Suppress Chrome extension errors globally
export const suppressExtensionErrors = () => {
  // Block console errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('chrome-extension://') || 
        message.includes('ERR_FILE_NOT_FOUND') ||
        message.includes('pejdijmoenmkgeppbflobdenhhabjlaj')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Block network errors
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('chrome-extension://')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Block unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.message?.includes('chrome-extension://')) {
      e.preventDefault();
      return false;
    }
  });
};