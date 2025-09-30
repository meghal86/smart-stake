// Suppress browser extensions that might interfere with the app
(function() {
  // Prevent extension conflicts
  if (window.chrome && window.chrome.runtime) {
    // Suppress extension messages
    const originalSendMessage = window.chrome.runtime.sendMessage;
    window.chrome.runtime.sendMessage = function() {
      // Suppress extension messages
    };
  }
})();
