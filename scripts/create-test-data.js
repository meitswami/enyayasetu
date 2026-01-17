// Script to create test users, wallets, and cases for testing
// Run with: node scripts/create-test-data.js

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
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

// Test users configuration
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'Admin@123',
    displayName: 'Admin User',
    role: 'admin',
    walletBalance: 50000.00,
    description: 'Administrator with full access'
  },
  {
    email: 'judge@test.com',
    password: 'Judge@123',
    displayName: 'Judge Sharma',
    role: 'user',
    courtRole: 'judge',
    walletBalance: 10000.00,
    description: 'Court Judge'
  },
  {
    email: 'prosecutor@test.com',
    password: 'Prosecutor@123',
    displayName: 'Public Prosecutor Singh',
    role: 'user',
    courtRole: 'public_prosecutor',
    walletBalance: 15000.00,
    description: 'Public Prosecutor'
  },
  {
    email: 'defence@test.com',
    password: 'Defence@123',
    displayName: 'Defence Lawyer Verma',
    role: 'user',
    courtRole: 'defence_lawyer',
    walletBalance: 20000.00,
    description: 'Defence Lawyer'
  },
  {
    email: 'accused@test.com',
    password: 'Accused@123',
    displayName: 'Accused Person',
    role: 'user',
    courtRole: 'accused',
    walletBalance: 5000.00,
    description: 'Accused in a case'
  },
  {
    email: 'victim@test.com',
    password: 'Victim@123',
    displayName: 'Victim Person',
    role: 'user',
    courtRole: 'victim',
    walletBalance: 8000.00,
    description: 'Victim in a case'
  },
  {
    email: 'victim_family@test.com',
    password: 'VictimFamily@123',
    displayName: 'Victim Family Member',
    role: 'user',
    courtRole: 'victim_family',
    walletBalance: 6000.00,
    description: 'Family member of victim'
  },
  {
    email: 'accused_family@test.com',
    password: 'AccusedFamily@123',
    displayName: 'Accused Family Member',
    role: 'user',
    courtRole: 'accused_family',
    walletBalance: 7000.00,
    description: 'Family member of accused'
  },
  {
    email: 'police@test.com',
    password: 'Police@123',
    displayName: 'Police Officer',
    role: 'user',
    courtRole: 'police_staff',
    walletBalance: 12000.00,
    description: 'Police staff member'
  },
  {
    email: 'steno@test.com',
    password: 'Steno@123',
    displayName: 'Court Stenographer',
    role: 'user',
    courtRole: 'steno',
    walletBalance: 9000.00,
    description: 'Court Stenographer'
  },
  {
    email: 'pp_assistant@test.com',
    password: 'PPAssistant@123',
    displayName: 'PP Assistant',
    role: 'user',
    courtRole: 'pp_assistant',
    walletBalance: 5500.00,
    description: 'Public Prosecutor Assistant'
  },
  {
    email: 'defence_assistant@test.com',
    password: 'DefenceAssistant@123',
    displayName: 'Defence Assistant',
    role: 'user',
    courtRole: 'defence_assistant',
    walletBalance: 6500.00,
    description: 'Defence Lawyer Assistant'
  },
  {
    email: 'audience@test.com',
    password: 'Audience@123',
    displayName: 'Court Audience',
    role: 'user',
    courtRole: 'audience',
    walletBalance: 3000.00,
    description: 'Court audience member'
  },
  {
    email: 'regular_user@test.com',
    password: 'User@123',
    displayName: 'Regular User',
    role: 'user',
    courtRole: 'accused',
    walletBalance: 10000.00,
    description: 'Regular user for general testing'
  }
];

// Test cases configuration
const testCases = [
  {
    title: 'Property Dispute Case',
    description: 'A civil case involving property ownership dispute between two parties.',
    plaintiff: 'Rajesh Kumar',
    defendant: 'Suresh Patel',
    category: 'Civil Case',
    status: 'pending',
    userRole: 'accused'
  },
  {
    title: 'Criminal Theft Case',
    description: 'Criminal case involving theft of valuable items from a jewelry store.',
    plaintiff: 'State of India',
    defendant: 'Amit Sharma',
    category: 'Criminal Case',
    status: 'in_progress',
    userRole: 'accused'
  },
  {
    title: 'Domestic Violence Case',
    description: 'Case involving domestic violence allegations and protection orders.',
    plaintiff: 'Priya Singh',
    defendant: 'Rahul Singh',
    category: 'Family Case',
    status: 'pending',
    userRole: 'victim'
  },
  {
    title: 'Contract Breach Case',
    description: 'Business contract breach case with financial damages claimed.',
    plaintiff: 'ABC Corporation',
    defendant: 'XYZ Enterprises',
    category: 'Commercial Case',
    status: 'adjourned',
    userRole: 'defence_lawyer'
  },
  {
    title: 'Motor Vehicle Accident Case',
    description: 'Road accident case with injury claims and insurance disputes.',
    plaintiff: 'Anjali Mehta',
    defendant: 'Vikram Reddy',
    category: 'Motor Vehicle Case',
    status: 'in_progress',
    userRole: 'victim'
  }
];

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate case number
function generateCaseNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `CASE-${year}-${random}`;
}

async function createTestData() {
  let connection;
  const credentials = [];

  try {
    // Display connection info (without password)
    console.log('=== Database Connection Info ===');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`Password: ${dbConfig.password ? '***' : '(not set)'}`);
    console.log('');

    // Test connection first
    console.log('Testing database connection...');
    connection = await mysql.createConnection(dbConfig);
    
    // Test query
    await connection.execute('SELECT 1 as test');
    console.log('✅ Successfully connected to database!\n');

    // Start transaction
    await connection.beginTransaction();

    console.log('\n=== Creating Test Users ===\n');

    for (const userConfig of testUsers) {
      try {
        // Check if user already exists
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [userConfig.email]
        );

        let userId;
        let caseCount = 0;
        if (existingUsers.length > 0) {
          // User exists - update password and other fields
          userId = existingUsers[0].id;
          const passwordHash = await bcrypt.hash(userConfig.password, 10);
          
          await connection.execute(
            `UPDATE users 
             SET password_hash = ?, 
                 email_verified = true,
                 raw_user_meta_data = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [
              passwordHash,
              JSON.stringify({ display_name: userConfig.displayName }),
              userId
            ]
          );
          
          // Update profile
          await connection.execute(
            `UPDATE profiles 
             SET display_name = ?, updated_at = NOW()
             WHERE user_id = ?`,
            [userConfig.displayName, userId]
          );
          
          // Update wallet balance
          await connection.execute(
            `UPDATE user_wallets 
             SET balance = ?, updated_at = NOW()
             WHERE user_id = ?`,
            [userConfig.walletBalance, userId]
          );
          
          // Count existing cases for this user
          if (userConfig.courtRole) {
            const [caseRows] = await connection.execute(
              'SELECT COUNT(*) as count FROM cases WHERE user_id = ?',
              [userId]
            );
            caseCount = caseRows[0]?.count || 0;
          }
          
          // Store credentials for updated user
          credentials.push({
            email: userConfig.email,
            password: userConfig.password,
            displayName: userConfig.displayName,
            role: userConfig.role,
            courtRole: userConfig.courtRole || 'N/A',
            walletBalance: `₹${userConfig.walletBalance.toFixed(2)}`,
            description: userConfig.description,
            casesCreated: caseCount
          });
          
          console.log(`✅ Updated existing user ${userConfig.email}`);
          console.log(`   Role: ${userConfig.role}${userConfig.courtRole ? ` / ${userConfig.courtRole}` : ''}`);
          console.log(`   Wallet: ₹${userConfig.walletBalance.toFixed(2)}`);
          console.log(`   Cases: ${caseCount}`);
          continue;
        }

        // Hash password for new user
        const passwordHash = await bcrypt.hash(userConfig.password, 10);
        userId = generateUUID();

        // Insert user
        await connection.execute(
          `INSERT INTO users (id, email, password_hash, email_verified, raw_user_meta_data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            userConfig.email,
            passwordHash,
            true, // Email verified for testing
            JSON.stringify({ display_name: userConfig.displayName })
          ]
        );

        // Create profile
        const profileId = generateUUID();
        await connection.execute(
          `INSERT INTO profiles (id, user_id, display_name, preferred_language, created_at, updated_at)
           VALUES (?, ?, ?, 'en', NOW(), NOW())`,
          [profileId, userId, userConfig.displayName]
        );

        // Create user role
        const roleId = generateUUID();
        await connection.execute(
          `INSERT INTO user_roles (id, user_id, role, created_at)
           VALUES (?, ?, ?, NOW())`,
          [roleId, userId, userConfig.role]
        );

        // Create wallet with balance
        const walletId = generateUUID();
        await connection.execute(
          `INSERT INTO user_wallets (id, user_id, balance, currency, created_at, updated_at)
           VALUES (?, ?, ?, 'INR', NOW(), NOW())`,
          [walletId, userId, userConfig.walletBalance]
        );

        // Create transaction record for initial wallet balance
        const transactionId = generateUUID();
        await connection.execute(
          `INSERT INTO transactions (id, user_id, transaction_type, amount, balance_before, balance_after, description, created_at)
           VALUES (?, ?, 'admin_adjustment', ?, 0.00, ?, 'Initial test wallet balance', NOW())`,
          [transactionId, userId, userConfig.walletBalance, userConfig.walletBalance]
        );

        // Create test cases for this user (if they have a court role)
        caseCount = 0;
        if (userConfig.courtRole) {
          // Assign 1-2 cases per user
          const casesToCreate = Math.random() > 0.5 ? 1 : 2;
          for (let i = 0; i < casesToCreate && i < testCases.length; i++) {
            const testCase = testCases[(caseCount + i) % testCases.length];
            const caseId = generateUUID();
            const caseNumber = generateCaseNumber();

            await connection.execute(
              `INSERT INTO cases (id, user_id, case_number, title, description, plaintiff, defendant, category, status, user_role, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                caseId,
                userId,
                caseNumber,
                testCase.title,
                testCase.description,
                testCase.plaintiff,
                testCase.defendant,
                testCase.category,
                testCase.status,
                userConfig.courtRole
              ]
            );
            caseCount++;
          }
        }

        // Store credentials
        credentials.push({
          email: userConfig.email,
          password: userConfig.password,
          displayName: userConfig.displayName,
          role: userConfig.role,
          courtRole: userConfig.courtRole || 'N/A',
          walletBalance: `₹${userConfig.walletBalance.toFixed(2)}`,
          description: userConfig.description,
          casesCreated: caseCount
        });

        console.log(`✅ Created user: ${userConfig.email} (${userConfig.displayName})`);
        console.log(`   Role: ${userConfig.role}${userConfig.courtRole ? ` / ${userConfig.courtRole}` : ''}`);
        console.log(`   Wallet: ₹${userConfig.walletBalance.toFixed(2)}`);
        console.log(`   Cases: ${caseCount}`);

      } catch (error) {
        console.error(`❌ Error creating user ${userConfig.email}:`, error.message);
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('\n✅ All test data created successfully!\n');

    // Generate credentials file
    const credentialsContent = generateCredentialsFile(credentials);
    const credentialsPath = join(__dirname, '..', 'TEST_CREDENTIALS.md');
    writeFileSync(credentialsPath, credentialsContent, 'utf-8');
    console.log(`📄 Credentials saved to: ${credentialsPath}\n`);

    // Print summary
    console.log('=== SUMMARY ===');
    console.log(`Total Users Created: ${credentials.length}`);
    console.log(`Total Cases Created: ${credentials.reduce((sum, c) => sum + c.casesCreated, 0)}`);
    console.log(`Total Wallet Balance: ₹${credentials.reduce((sum, c) => sum + parseFloat(c.walletBalance.replace('₹', '').replace(',', '')), 0).toFixed(2)}`);

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    
    console.error('\n❌ Error occurred:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Refused - Possible issues:');
      console.error('1. MySQL server is not running');
      console.error('2. Wrong host/port in .env file');
      console.error('3. Firewall blocking the connection');
      console.error('\n📝 Check your .env file:');
      console.error('   DB_HOST=' + (process.env.DB_HOST || 'localhost'));
      console.error('   DB_USER=' + (process.env.DB_USER || 'root'));
      console.error('   DB_PASSWORD=' + (process.env.DB_PASSWORD ? '***' : '(not set)'));
      console.error('   DB_NAME=' + (process.env.DB_NAME || 'u334425891_ecourtcase'));
      console.error('\n💡 Make sure you have a .env file in the project root with:');
      console.error('   DB_HOST=your_host');
      console.error('   DB_USER=your_user');
      console.error('   DB_PASSWORD=your_password');
      console.error('   DB_NAME=your_database');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access Denied - Check your username and password in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database does not exist - Check DB_NAME in .env file');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function generateCredentialsFile(credentials) {
  let content = '# Test User Credentials\n\n';
  content += '> **⚠️ FOR TESTING PURPOSES ONLY**\n\n';
  content += 'This file contains test user credentials for development and testing.\n\n';
  content += '---\n\n';

  // Group by role
  const adminUsers = credentials.filter(c => c.role === 'admin');
  const regularUsers = credentials.filter(c => c.role === 'user');

  if (adminUsers.length > 0) {
    content += '## 👑 Admin Users\n\n';
    adminUsers.forEach((user, index) => {
      content += `### ${index + 1}. ${user.displayName}\n\n`;
      content += `- **Email:** \`${user.email}\`\n`;
      content += `- **Password:** \`${user.password}\`\n`;
      content += `- **Role:** ${user.role}\n`;
      content += `- **Wallet Balance:** ${user.walletBalance}\n`;
      content += `- **Description:** ${user.description}\n`;
      content += `- **Test Cases:** ${user.casesCreated}\n\n`;
      content += '---\n\n';
    });
  }

  if (regularUsers.length > 0) {
    content += '## 👥 Regular Users\n\n';
    regularUsers.forEach((user, index) => {
      content += `### ${index + 1}. ${user.displayName}\n\n`;
      content += `- **Email:** \`${user.email}\`\n`;
      content += `- **Password:** \`${user.password}\`\n`;
      content += `- **Role:** ${user.role}\n`;
      content += `- **Court Role:** ${user.courtRole}\n`;
      content += `- **Wallet Balance:** ${user.walletBalance}\n`;
      content += `- **Description:** ${user.description}\n`;
      content += `- **Test Cases:** ${user.casesCreated}\n\n`;
      content += '---\n\n';
    });
  }

  // Quick copy section
  content += '## 📋 Quick Copy Section\n\n';
  content += 'Copy and paste these credentials one by one:\n\n';
  content += '```\n';
  credentials.forEach((user, index) => {
    content += `${index + 1}. ${user.displayName}\n`;
    content += `   Email: ${user.email}\n`;
    content += `   Password: ${user.password}\n`;
    content += `   Role: ${user.role}${user.courtRole !== 'N/A' ? ` / ${user.courtRole}` : ''}\n`;
    content += `   Wallet: ${user.walletBalance}\n`;
    content += `   Cases: ${user.casesCreated}\n\n`;
  });
  content += '```\n\n';

  // CSV format for easy import
  content += '## 📊 CSV Format (for spreadsheet)\n\n';
  content += '```csv\n';
  content += 'Email,Password,Display Name,Role,Court Role,Wallet Balance,Description,Cases\n';
  credentials.forEach(user => {
    content += `${user.email},${user.password},${user.displayName},${user.role},${user.courtRole},${user.walletBalance},${user.description},${user.casesCreated}\n`;
  });
  content += '```\n';

  return content;
}

// Run the script
createTestData().catch(console.error);

