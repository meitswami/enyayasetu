// Quick database connection test
import mysql from 'mysql2/promise';
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

console.log('🔍 Testing Database Connection...');
console.log('Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' : '(empty)'
});
console.log('');

async function testConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Successfully connected to database!');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as `current_time`');
    console.log('✅ Test query successful:', rows[0]);
    
    // Check if users table exists
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'",
      [dbConfig.database]
    );
    
    if (tables[0].count > 0) {
      console.log('✅ Users table exists');
      
      // Count users
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Found ${userCount[0].count} users in database`);
      
      // Check admin user
      const [adminUsers] = await connection.execute(
        "SELECT u.email, ur.role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.email = ?",
        ['admin@test.com']
      );
      
      if (adminUsers.length > 0) {
        console.log('✅ Admin user found:', adminUsers[0]);
      } else {
        console.log('⚠️  Admin user (admin@test.com) not found');
      }
    } else {
      console.log('❌ Users table does not exist. Run migrations first!');
    }
    
    await connection.end();
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check if DB_HOST is correct:', dbConfig.host);
      console.error('   2. Check if DB_PORT is correct:', dbConfig.port);
      console.error('   3. Check if database server is running');
      console.error('   4. Check firewall/network settings');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check DB_USER:', dbConfig.user);
      console.error('   2. Check DB_PASSWORD (currently set)');
      console.error('   3. Verify credentials in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check DB_NAME:', dbConfig.database);
      console.error('   2. Database might not exist');
    }
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

testConnection();

