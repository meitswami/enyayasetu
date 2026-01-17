/**
 * Dynamically determines the API URL based on the current hostname
 * Works across different hosting platforms (Netlify, Render, Vercel, etc.)
 * 
 * Strategy:
 * 1. Use VITE_API_URL if set and valid (not localhost in production)
 * 2. If localhost, use localhost:3000
 * 3. In production, try to infer from hostname or use same origin
 */
export function getApiUrl(includeApiPath: boolean = false): string {
  // First, check if VITE_API_URL is explicitly set (environment variable)
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // Get current hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  
  // If running on localhost, use localhost API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const baseUrl = envApiUrl || 'http://localhost:3000';
    // Remove trailing /api if it exists, we'll add it conditionally
    const cleanUrl = baseUrl.replace(/\/api\/?$/, '');
    return includeApiPath ? `${cleanUrl}/api` : cleanUrl;
  }

  // If VITE_API_URL is set and not localhost, use it
  if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
    const cleanUrl = envApiUrl.replace(/\/api\/?$/, '');
    return includeApiPath ? `${cleanUrl}/api` : cleanUrl;
  }

  // For production deployments without explicit API URL:
  // Option 1: Try same origin (if backend is on same domain)
  // Option 2: Try API subdomain (app.example.com -> api.example.com)
  // Option 3: Default to same origin with /api path
  
  // Strategy: Use same origin for now (backend might be on same domain)
  // User can override with VITE_API_URL environment variable
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  if (includeApiPath) {
    return `${origin}/api`;
  }
  
  return origin;
}

// Export convenience constants
export const API_URL = getApiUrl(false); // Base URL without /api
export const API_BASE_URL = getApiUrl(true); // Base URL with /api
