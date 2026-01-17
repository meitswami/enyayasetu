// Authentication Service
// Replaces Supabase Auth with custom JWT-based authentication

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, queryOne, insert, update, generateUUID } from '../integrations/mysql/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  raw_user_meta_data?: any;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: Error | null;
}

// Sign up new user
export async function signUp(
  email: string,
  password: string,
  metadata?: { display_name?: string }
): Promise<AuthResponse> {
  try {
    // Check if user already exists
    const existingUser = await queryOne<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return {
        data: null,
        error: new Error('User already exists'),
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    // Insert user
    await insert('users', {
      id: userId,
      email,
      password_hash: passwordHash,
      email_verified: false,
      raw_user_meta_data: metadata ? JSON.stringify(metadata) : null,
    });

    // Create profile
    await insert('profiles', {
      id: generateUUID(),
      user_id: userId,
      display_name: metadata?.display_name || null,
      preferred_language: 'en',
    });

    // Create default user role
    await insert('user_roles', {
      id: generateUUID(),
      user_id: userId,
      role: 'user',
    });

    // Create wallet
    await insert('user_wallets', {
      id: generateUUID(),
      user_id: userId,
      balance: 0.00,
      currency: 'INR',
    });

    // Get created user
    const user = await queryOne<User>(
      'SELECT id, email, email_verified, raw_user_meta_data, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return {
        data: null,
        error: new Error('Failed to create user'),
      };
    }

    // Generate token
    const token = generateToken(userId);
    const session = createSession(user, token);

    return {
      data: { user, session },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error,
    };
  }
}

// Sign in user
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Get user with password hash
    const userWithPassword = await queryOne<{
      id: string;
      email: string;
      email_verified: boolean;
      raw_user_meta_data: string | null;
      created_at: string;
      updated_at: string;
      password_hash: string;
    }>(
      'SELECT id, email, email_verified, raw_user_meta_data, created_at, updated_at, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (!userWithPassword) {
      return {
        data: null,
        error: new Error('Invalid email or password'),
      };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, userWithPassword.password_hash);
    if (!isValid) {
      return {
        data: null,
        error: new Error('Invalid email or password'),
      };
    }

    // Create user object without password
    const user: User = {
      id: userWithPassword.id,
      email: userWithPassword.email,
      email_verified: userWithPassword.email_verified,
      raw_user_meta_data: userWithPassword.raw_user_meta_data
        ? JSON.parse(userWithPassword.raw_user_meta_data)
        : null,
      created_at: userWithPassword.created_at,
      updated_at: userWithPassword.updated_at,
    };

    // Generate token
    const token = generateToken(user.id);
    const session = createSession(user, token);

    return {
      data: { user, session },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error,
    };
  }
}

// Verify JWT token
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await queryOne<User>(
      'SELECT id, email, email_verified, raw_user_meta_data, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    return user;
  } catch (error) {
    return null;
  }
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Create session object
function createSession(user: User, token: string): Session {
  const decoded = jwt.decode(token) as { exp: number };
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 604800;

  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: expiresIn,
    user,
  };
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await queryOne<{ role: string }>(
    'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
    [userId, 'admin']
  );
  return !!role;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT id, email, email_verified, raw_user_meta_data, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );
}

