// Verify password hash for admin user
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u334425891_ecourtcase',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  // SSL configuration for Hostinger
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('hstgr.io') ? {
    rejectUnauthorized: false
  } : false,
};

async function verifyPassword() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Get admin user
    const [users] = await connection.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      ['admin@test.com']
    );
    
    if (users.length === 0) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('Found user:', user.email);
    console.log('Password hash:', user.password_hash);
    console.log('');
    
    // Test password
    const testPassword = 'Admin@123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('Testing password:', testPassword);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('\n⚠️  Password does not match!');
      console.log('Updating password...');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newHash, user.id]
      );
      
      console.log('✅ Password updated!');
      
      // Verify again
      const [updatedUsers] = await connection.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [user.id]
      );
      const newIsValid = await bcrypt.compare(testPassword, updatedUsers[0].password_hash);
      console.log('Verification after update:', newIsValid);
    } else {
      console.log('✅ Password is correct!');
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

verifyPassword();

