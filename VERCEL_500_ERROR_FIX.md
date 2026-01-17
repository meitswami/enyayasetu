# Vercel 500 Internal Server Error - Troubleshooting

## Current Issue
Getting **500 Internal Server Error** with "FUNCTION_INVOCATION_FAILED" - The serverless function is running but crashing.

## Common Causes

### 1. Missing Environment Variables ⚠️ MOST LIKELY
The database connection is failing because environment variables aren't set in Vercel.

**Check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure ALL these variables are set:
   - `DB_HOST` = `auth-db1274.hstgr.io`
   - `DB_PORT` = `3306`
   - `DB_USER` = `u334425891_ecourtcase`
   - `DB_PASSWORD` = `U9OevrCbw!`
   - `DB_NAME` = `u334425891_ecourtcase`
   - `JWT_SECRET` = (your generated secret)
   - `API_PORT` = `3000`
   - `NODE_ENV` = `production`

### 2. Check Function Logs
In Vercel Dashboard:
1. Go to your project → **Functions** tab
2. Click on `api/index.js`
3. Go to **Logs** tab
4. Look for error messages

Common errors you might see:
- `ECONNREFUSED` - Database connection refused
- `ER_ACCESS_DENIED_ERROR` - Wrong database credentials
- `Cannot find module` - Import error
- `JWT_SECRET is not set` - Missing JWT secret

### 3. Test Database Connection
The database connection might be failing. Check:
- Are the database credentials correct?
- Does Hostinger allow connections from Vercel's IPs?
- Is the database server running?

## How to Debug

### Step 1: Check Vercel Logs
1. Go to Vercel Dashboard
2. Click your project
3. Go to **Functions** → `api/index.js` → **Logs**
4. Look at the latest error messages

### Step 2: Test Environment Variables
Add a test endpoint to check if env vars are set:

```javascript
app.get('/api/test-env', (req, res) => {
  res.json({
    dbHost: process.env.DB_HOST || 'NOT SET',
    dbUser: process.env.DB_USER || 'NOT SET',
    dbName: process.env.DB_NAME || 'NOT SET',
    jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET'
  });
});
```

Then visit: `https://enyayasetu.vercel.app/api/test-env`

### Step 3: Check Database Connection
The database connection might be failing. Common issues:
- **Hostinger Firewall**: Might block Vercel's IPs
- **SSL Required**: Hostinger might require SSL connections
- **Wrong Credentials**: Double-check all DB_* variables

## Quick Fixes

### Fix 1: Add All Environment Variables
Make sure ALL variables from `.env.example` are set in Vercel.

### Fix 2: Check Function Logs
The logs will tell you exactly what's wrong.

### Fix 3: Test with Simple Endpoint
The `/health` endpoint should work even without database. If that fails, it's an import/module issue.

## Next Steps

1. **Check Vercel Function Logs** - This will show the exact error
2. **Verify Environment Variables** - Make sure all are set
3. **Test `/api` endpoint** - See if it returns anything
4. **Share the error from logs** - Then we can fix the specific issue

**Most likely:** Missing `JWT_SECRET` or database connection failing due to missing/env vars.
