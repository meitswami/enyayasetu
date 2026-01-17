# PostgreSQL to MySQL Migration Guide

## ⚠️ Migration Scope & Complexity

This is a **major architectural change** that affects:
- **14 SQL migration files** → Need conversion to MySQL syntax
- **26+ TypeScript/React files** using Supabase client → Need database client replacement
- **14 Supabase Edge Functions** → Need to become Node.js API endpoints
- **Authentication system** → Need custom auth or alternative
- **File storage** → Need alternative storage solution
- **Real-time subscriptions** → Need WebSocket or polling alternative

---

## 📋 PostgreSQL-Specific Features to Convert

### 1. **Data Types**

| PostgreSQL | MySQL Equivalent |
|------------|----------------|
| `UUID` | `CHAR(36)` or `BINARY(16)` (UUID stored as string) |
| `TEXT` | `TEXT` or `VARCHAR(65535)` |
| `TIMESTAMPTZ` | `DATETIME` or `TIMESTAMP` (MySQL handles timezones differently) |
| `JSONB` | `JSON` (MySQL 5.7+) |
| `ENUM` | `ENUM` (works similarly) |
| `DECIMAL(10, 2)` | `DECIMAL(10, 2)` (same) |

### 2. **Functions**

| PostgreSQL | MySQL Equivalent |
|------------|----------------|
| `gen_random_uuid()` | `UUID()` or application-level UUID generation |
| `now()` | `NOW()` or `CURRENT_TIMESTAMP` |
| `auth.uid()` | Custom function or application-level check |

### 3. **Features NOT Available in MySQL**

- **Row Level Security (RLS)** → Must implement in application layer
- **PostgreSQL Functions (PL/pgSQL)** → Convert to MySQL stored procedures or application logic
- **Supabase Auth** → Replace with custom JWT auth or library (Passport.js, NextAuth, etc.)
- **Supabase Storage** → Use local file system or cloud storage (AWS S3, Cloudflare R2)
- **Real-time subscriptions** → Use WebSockets (Socket.io) or Server-Sent Events

---

## 🔄 Migration Steps

### Phase 1: Database Schema Conversion

#### Step 1.1: Convert ENUM Types

**PostgreSQL:**
```sql
CREATE TYPE public.transaction_type AS ENUM (
  'wallet_topup',
  'hearing_payment',
  'addon_payment',
  'refund',
  'admin_adjustment'
);
```

**MySQL:**
```sql
-- Option 1: Use ENUM (limited)
CREATE TABLE transactions (
  transaction_type ENUM('wallet_topup', 'hearing_payment', 'addon_payment', 'refund', 'admin_adjustment') NOT NULL
);

-- Option 2: Use VARCHAR with CHECK constraint (recommended for flexibility)
CREATE TABLE transactions (
  transaction_type VARCHAR(50) NOT NULL,
  CHECK (transaction_type IN ('wallet_topup', 'hearing_payment', 'addon_payment', 'refund', 'admin_adjustment'))
);
```

#### Step 1.2: Convert UUID Primary Keys

**PostgreSQL:**
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**MySQL:**
```sql
CREATE TABLE user_wallets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Step 1.3: Convert JSONB to JSON

**PostgreSQL:**
```sql
metadata JSONB DEFAULT '{}'::jsonb
```

**MySQL:**
```sql
metadata JSON DEFAULT (JSON_OBJECT())
```

#### Step 1.4: Convert Timestamps

**PostgreSQL:**
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

**MySQL:**
```sql
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
```

#### Step 1.5: Remove RLS Policies

**PostgreSQL:**
```sql
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);
```

**MySQL:**
```sql
-- RLS must be implemented in application layer
-- No equivalent SQL syntax
```

#### Step 1.6: Convert PostgreSQL Functions to MySQL Stored Procedures

**PostgreSQL:**
```sql
CREATE OR REPLACE FUNCTION public.update_wallet_balance(...)
RETURNS UUID
LANGUAGE plpgsql
AS $$
BEGIN
  -- function body
END;
$$;
```

**MySQL:**
```sql
DELIMITER //
CREATE PROCEDURE update_wallet_balance(...)
BEGIN
  -- procedure body
END //
DELIMITER ;
```

---

### Phase 2: Replace Supabase Client

#### Step 2.1: Install MySQL Client Library

```bash
npm install mysql2
# or
npm install prisma @prisma/client
```

#### Step 2.2: Create MySQL Client Wrapper

**Create `src/integrations/mysql/client.ts`:**
```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export { pool };
```

#### Step 2.3: Replace Supabase Queries

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('cases')
  .select('*')
  .eq('user_id', userId);
```

**After (MySQL):**
```typescript
import { pool } from '@/integrations/mysql/client';

const [rows] = await pool.execute(
  'SELECT * FROM cases WHERE user_id = ?',
  [userId]
);
```

---

### Phase 3: Replace Authentication

#### Option A: Custom JWT Authentication

**Install dependencies:**
```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

**Create auth service:**
```typescript
// src/services/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '@/integrations/mysql/client';

export async function signUp(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  
  await pool.execute(
    'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
    [userId, email, hashedPassword]
  );
  
  return generateToken(userId);
}

export async function signIn(email: string, password: string) {
  const [rows] = await pool.execute(
    'SELECT id, password_hash FROM users WHERE email = ?',
    [email]
  );
  
  if (rows.length === 0) throw new Error('User not found');
  
  const isValid = await bcrypt.compare(password, rows[0].password_hash);
  if (!isValid) throw new Error('Invalid password');
  
  return generateToken(rows[0].id);
}

function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}
```

#### Option B: Use NextAuth.js or Passport.js

---

### Phase 4: Replace File Storage

**Supabase Storage:**
```typescript
await supabase.storage.from('evidence').upload(fileName, file);
```

**MySQL + Local Storage:**
```typescript
import fs from 'fs/promises';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads', 'evidence');
await fs.mkdir(uploadDir, { recursive: true });

const filePath = path.join(uploadDir, fileName);
await fs.writeFile(filePath, fileBuffer);

// Store path in database
await pool.execute(
  'INSERT INTO case_evidence (file_url) VALUES (?)',
  [`/uploads/evidence/${fileName}`]
);
```

**For Hostinger shared hosting:** Use `public_html/uploads/` directory.

---

### Phase 5: Convert Edge Functions to API Endpoints

**Supabase Edge Function:**
```typescript
// supabase/functions/ai-judge/index.ts
Deno.serve(async (req) => {
  // function code
});
```

**Node.js/Express API:**
```typescript
// src/api/routes/ai-judge.ts
import express from 'express';
const router = express.Router();

router.post('/ai-judge', async (req, res) => {
  // same logic, different runtime
});

export default router;
```

---

## 📝 MySQL Migration File Template

Create a new migration file: `mysql/migrations/001_initial_schema.sql`

```sql
-- MySQL Migration: Initial Schema
-- Converted from PostgreSQL

-- Create users table (replaces auth.users)
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create profiles table
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cases table
CREATE TABLE cases (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  case_number VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  plaintiff VARCHAR(255) NOT NULL,
  defendant VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Custom Case',
  status ENUM('pending', 'in_progress', 'adjourned', 'verdict_delivered', 'closed') DEFAULT 'pending',
  user_role VARCHAR(50) NOT NULL,
  next_hearing_date DATE,
  verdict TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_case_number (case_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_wallets table
CREATE TABLE user_wallets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (balance >= 0),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transactions table
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id CHAR(36),
  reference_type VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CHECK (transaction_type IN ('wallet_topup', 'hearing_payment', 'addon_payment', 'refund', 'admin_adjustment')),
  INDEX idx_user_id (user_id),
  INDEX idx_reference (reference_id, reference_type),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🚀 Implementation Plan

### Week 1: Database Setup
1. ✅ Create MySQL database on Hostinger
2. ✅ Convert all 14 migration files to MySQL syntax
3. ✅ Test schema creation
4. ✅ Migrate existing data (if any)

### Week 2: Backend API
1. ✅ Set up Express.js or similar Node.js framework
2. ✅ Convert all 14 Edge Functions to API endpoints
3. ✅ Implement authentication middleware
4. ✅ Set up file upload handling

### Week 3: Frontend Updates
1. ✅ Replace Supabase client with MySQL client wrapper
2. ✅ Update all 26+ files using `supabase.`
3. ✅ Implement authentication hooks
4. ✅ Update file upload components

### Week 4: Testing & Deployment
1. ✅ Test all functionality
2. ✅ Deploy to Hostinger
3. ✅ Configure file storage paths
4. ✅ Set up environment variables

---

## ⚠️ Important Considerations

### 1. **Hostinger Shared Hosting Limitations**
- May have limited Node.js support (check if Node.js is available)
- File upload size limits
- Database connection limits
- May need to use PHP for some endpoints if Node.js isn't available

### 2. **Missing Features**
- **Real-time subscriptions**: Need WebSocket server or polling
- **Row Level Security**: Must implement in application code
- **Automatic UUID generation**: Use `UUID()` function or application-level

### 3. **Performance**
- MySQL may have different performance characteristics
- Consider connection pooling
- Index optimization may differ

### 4. **Data Migration**
- Export data from PostgreSQL
- Transform data format (UUIDs, timestamps, JSON)
- Import to MySQL

---

## 📚 Recommended Tools

1. **Database Client**: Prisma ORM (easier migration) or mysql2 (direct)
2. **Authentication**: NextAuth.js, Passport.js, or custom JWT
3. **File Storage**: Local filesystem or cloud storage (AWS S3, Cloudflare R2)
4. **API Framework**: Express.js, Fastify, or Hono
5. **Real-time**: Socket.io for WebSockets

---

## 🔗 Next Steps

1. **Decide on approach**: Full migration or hybrid (keep some Supabase features)?
2. **Set up MySQL database** on Hostinger
3. **Start with one migration file** as a test
4. **Create MySQL client wrapper** and test basic queries
5. **Gradually convert** components one by one

Would you like me to:
1. **Convert all migration files** to MySQL syntax?
2. **Create a MySQL client wrapper** to replace Supabase?
3. **Set up authentication system** for MySQL?
4. **Convert specific Edge Functions** to API endpoints?

Let me know which part you'd like to start with!

