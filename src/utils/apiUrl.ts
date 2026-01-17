/**
 * Dynamically determines the API URL based on the current hostname
 * Works across different hosting platforms (Netlify, Render, Vercel, etc.)
 * 
 * Strategy:
 * 1. Use VITE_API_URL if set and valid (not localhost in production)
 * 2. If localhost, use localhost:3000
 * 3. In production, warn if API URL is not configured
 */
export function getApiUrl(includeApiPath: boolean = false): string {
  // First, check if VITE_API_URL is explicitly set (environment variable)
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // Get current hostname (runtime check - only available in browser)
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // If running on localhost, use localhost API
  if (isLocalhost) {
    const baseUrl = envApiUrl || 'http://localhost:3000';
    // Remove trailing /api if it exists, we'll add it conditionally
    const cleanUrl = baseUrl.replace(/\/api\/?$/, '');
    return includeApiPath ? `${cleanUrl}/api` : cleanUrl;
  }

  // In production (not localhost):
  // If VITE_API_URL is set and not localhost, use it
  if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
    const cleanUrl = envApiUrl.replace(/\/api\/?$/, '');
    return includeApiPath ? `${cleanUrl}/api` : cleanUrl;
  }

  // Production but no VITE_API_URL configured - this is an error
  // We'll still return same origin, but log a warning
  if (isBrowser && !envApiUrl) {
    console.warn(
      '⚠️ VITE_API_URL is not configured. API calls will use same origin.\n' +
      'Please set VITE_API_URL environment variable to your backend server URL.\n' +
      'Example: https://your-backend.example.com'
    );
  }

  // Fallback: Use same origin (only works if backend is on same domain)
  // This is a last resort - user should configure VITE_API_URL
  const origin = isBrowser ? window.location.origin : '';
  
  if (includeApiPath) {
    return `${origin}/api`;
  }
  
  return origin;
}

// Export convenience constants
export const API_URL = getApiUrl(false); // Base URL without /api
export const API_BASE_URL = getApiUrl(true); // Base URL with /api
