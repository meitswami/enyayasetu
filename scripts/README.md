# Test Data Creation Script

This script creates dummy test users, wallets with loaded money, and test cases for development and testing purposes.

## Usage

1. **Create a `.env` file** in the project root (if you don't have one):
   ```bash
   # Copy from .env.example if it exists, or create manually
   ```
   
   Add your database configuration:
   ```env
   DB_HOST=auth-db1274.hstgr.io
   DB_USER=u334425891_ecourtcase
   DB_PASSWORD=U9OevrCbw!
   DB_NAME=u334425891_ecourtcase
   DB_PORT=3306
   ```
   
   **OR** set environment variables directly:
   ```bash
   export DB_HOST=auth-db1274.hstgr.io
   export DB_USER=u334425891_ecourtcase
   export DB_PASSWORD=U9OevrCbw!
   export DB_NAME=u334425891_ecourtcase
   ```

2. **Run the script**:
   ```bash
   npm run create-test-data
   ```

   Or directly:
   ```bash
   node scripts/create-test-data.js
   ```

## What it creates

- **14 test users** with different roles:
  - 1 Admin user
  - 13 Regular users with various court roles (judge, prosecutor, defence lawyer, accused, victim, etc.)

- **Wallets** with pre-loaded money (₹3,000 to ₹50,000)

- **Test cases** (1-2 cases per user with court roles)

## Output

After running, the script will:
1. Create all users, wallets, and cases in the database
2. Generate a `TEST_CREDENTIALS.md` file in the project root with all credentials

## Credentials File

The `TEST_CREDENTIALS.md` file contains:
- All user credentials (email and password)
- User roles and court roles
- Wallet balances
- Number of test cases created
- Quick copy section for easy copy-paste
- CSV format for spreadsheet import

## Notes

- The script checks for existing users and skips them (won't create duplicates)
- All passwords follow a pattern: `Role@123` (e.g., `Admin@123`, `Judge@123`)
- Email addresses follow the pattern: `role@test.com`
- All wallets are loaded with test money via admin adjustment transactions

