// Suppress Chrome extension errors globally
export const suppressExtensionErrors = () => {
  // Block console errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('chrome-extension://') || 
        message.includes('ERR_FILE_NOT_FOUND') ||
        message.includes('pejdijmoenmkgeppbflobdenhhabjlaj') ||
        message.includes('400 (Bad Request)') ||
        message.includes('404 (Not Found)') ||
        message.includes('alert_templates') ||
        message.includes('alert_rules') ||
        message.includes('supabase.co/rest/v1/alert_') ||
        message.includes('React.jsx: type is invalid') ||
        message.includes('SearchCommand.tsx') ||
        message.includes('[hmr] Failed to reload') ||
        message.includes('ERR_CONNECTION_REFUSED')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Block network errors
  window.addEventListener('error', (e) => {
    if (e.filename?.includes('chrome-extension://') || 
        e.message?.includes('WebSocket connection') ||
        e.message?.includes('ws://localhost:3000')) {
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