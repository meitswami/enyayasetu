// MySQL Client Wrapper
// Replaces Supabase client for MySQL database operations

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// SSL configuration for Hostinger (required for remote connections)
const sslConfig = process.env.DB_HOST && process.env.DB_HOST.includes('hstgr.io') ? {
  rejectUnauthorized: false // Hostinger uses self-signed certificates
} : false;

// Create connection pool configuration
const poolConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u334425891_ecourtcase',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Connection timeout settings
  connectTimeout: 10000,
  acquireTimeout: 10000,
  // SSL configuration
  ssl: sslConfig,
};

// Only add port if explicitly set (MySQL defaults to 3306)
if (process.env.DB_PORT) {
  poolConfig.port = parseInt(process.env.DB_PORT);
} else {
  // Explicitly set default port for clarity
  poolConfig.port = 3306;
}

// Log configuration for debugging
console.log('🔧 MySQL Pool Configuration:');
console.log('   Host:', poolConfig.host);
console.log('   Port:', poolConfig.port);
console.log('   Database:', poolConfig.database);
console.log('   User:', poolConfig.user);
console.log('   SSL:', sslConfig ? 'Enabled (Hostinger)' : 'Disabled');

const pool = mysql.createPool(poolConfig);

// Helper function to execute queries
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error: any) {
    console.error('MySQL Query Error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('❌ Database connection failed. Check:');
      console.error('   - DB_HOST:', process.env.DB_HOST || 'NOT SET');
      console.error('   - DB_PORT:', process.env.DB_PORT || '3306 (default)');
      console.error('   - DB_USER:', process.env.DB_USER || 'NOT SET');
      console.error('   - DB_NAME:', process.env.DB_NAME || 'NOT SET');
      console.error('   - Is the database server running?');
      console.error('   - Are the credentials correct?');
      console.error('   - Is the .env file loaded?');
    }
    throw error;
  }
}

// Helper function for single row queries
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper function for insert operations
export async function insert(
  table: string,
  data: Record<string, any>
): Promise<{ insertId: number }> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  
  const [result] = await pool.execute(sql, values) as any;
  return { insertId: result.insertId };
}

// Helper function for update operations
export async function update(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<{ affectedRows: number }> {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  const values = [...Object.values(data), ...Object.values(where)];
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  
  const [result] = await pool.execute(sql, values) as any;
  return { affectedRows: result.affectedRows };
}

// Helper function for delete operations
export async function remove(
  table: string,
  where: Record<string, any>
): Promise<{ affectedRows: number }> {
  const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  const values = Object.values(where);
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  
  const [result] = await pool.execute(sql, values) as any;
  return { affectedRows: result.affectedRows };
}

// Helper function to generate UUID (for compatibility)
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Close pool connection (for cleanup)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Export pool for advanced usage
export { pool };

// Supabase-like query builder (simplified)
export class QueryBuilder<T = any> {
  private table: string;
  private selectFields: string[] = ['*'];
  private whereConditions: { field: string; operator: string; value: any }[] = [];
  private orderByField?: string;
  private orderByDirection: 'ASC' | 'DESC' = 'ASC';
  private limitCount?: number;
  private offsetCount?: number;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string | string[]): this {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  eq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  neq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '!=', value });
    return this;
  }

  gt(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '>', value });
    return this;
  }

  lt(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '<', value });
    return this;
  }

  order(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByField = field;
    this.orderByDirection = direction;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  async execute(): Promise<T[]> {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.table}`;
    const params: any[] = [];

    if (this.whereConditions.length > 0) {
      const whereClause = this.whereConditions
        .map(cond => `${cond.field} ${cond.operator} ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...this.whereConditions.map(cond => cond.value));
    }

    if (this.orderByField) {
      sql += ` ORDER BY ${this.orderByField} ${this.orderByDirection}`;
    }

    if (this.limitCount) {
      sql += ` LIMIT ?`;
      params.push(this.limitCount);
    }

    if (this.offsetCount) {
      sql += ` OFFSET ?`;
      params.push(this.offsetCount);
    }

    return query<T>(sql, params);
  }

  async single(): Promise<T | null> {
    const results = await this.execute();
    return results.length > 0 ? results[0] : null;
  }
}

// Supabase-like API
export function from<T = any>(table: string): QueryBuilder<T> {
  return new QueryBuilder<T>(table);
}

