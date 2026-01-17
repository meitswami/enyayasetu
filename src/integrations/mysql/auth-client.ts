// MySQL Auth Client
// Provides Supabase-like auth interface for MySQL

import { signUp, signIn, verifyToken, getUserById, isAdmin, Session, User } from '../../services/auth';

export class AuthClient {
  private session: Session | null = null;

  // Get current session from localStorage
  getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      try {
        this.session = JSON.parse(stored);
        return this.session;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Get current user
  getUser(): User | null {
    const session = this.getSession();
    return session?.user || null;
  }

  // Sign up
  async signUp(email: string, password: string, options?: { data?: { display_name?: string } }) {
    const result = await signUp(email, password, options?.data);
    
    if (result.data?.session) {
      this.session = result.data.session;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_session', JSON.stringify(result.data.session));
      }
    }
    
    return result;
  }

  // Sign in
  async signInWithPassword(credentials: { email: string; password: string }) {
    const result = await signIn(credentials.email, credentials.password);
    
    if (result.data?.session) {
      this.session = result.data.session;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_session', JSON.stringify(result.data.session));
      }
    }
    
    return result;
  }

  // Sign out
  async signOut() {
    this.session = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
    return { error: null };
  }

  // Get current user ID
  getUserId(): string | null {
    const user = this.getUser();
    return user?.id || null;
  }

  // Verify current session
  async verifySession(): Promise<boolean> {
    const session = this.getSession();
    if (!session) return false;

    const user = await verifyToken(session.access_token);
    if (!user) {
      this.signOut();
      return false;
    }

    return true;
  }

  // Check if user is admin
  async checkIsAdmin(): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) return false;
    return isAdmin(userId);
  }

  // On auth state change (simplified - for real-time, use WebSockets)
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Check session on mount
    const session = this.getSession();
    if (session) {
      callback('SIGNED_IN', session);
    } else {
      callback('SIGNED_OUT', null);
    }

    // Return unsubscribe function
    return {
      unsubscribe: () => {},
    };
  }
}

// Export singleton instance
export const auth = new AuthClient();

