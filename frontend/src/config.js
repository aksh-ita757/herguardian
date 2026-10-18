// ============================================
// HerGuardian — Frontend runtime config
//
// VITE_API_URL = origin of your deployed backend, WITHOUT "/api" and without a trailing slash.
//   production:  https://herguardian-api.onrender.com
//   local dev:   leave EMPTY → requests go to "/api/..." and Vite proxies them to localhost:5000
//
// Vite bakes this value in at BUILD time, so after changing it you must REDEPLOY the frontend.
// ============================================
import axios from 'axios';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

// Build a full URL for fetch(): apiUrl('/api/auth/login')
export const apiUrl = (path) => `${API_ORIGIN}${path}`;

// Makes every plain `axios.get('/api/...')` in the app hit the backend too.
axios.defaults.baseURL = API_ORIGIN || undefined;

if (import.meta.env.PROD && !API_ORIGIN) {
  // Production build without VITE_API_URL → calls would go to the frontend host and 404.
  console.error('[HerGuardian] VITE_API_URL is not set. API calls will fail. Set it in your hosting dashboard and redeploy.');
}
