import { createRoot } from 'react-dom/client'
import { initSentry } from '@/lib/sentry'
import App from './App'
import './index.css'
import './styles/compact.css'

initSentry();

// Register PWA service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
