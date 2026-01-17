# Quick Start Guide

## ⚠️ IMPORTANT: Start the Backend Server First!

The "Failed to fetch" error means the backend server is not running.

## Step-by-Step Instructions

### 1. Start the Backend Server

Open a **new terminal/PowerShell window** and run:

```bash
cd "D:\All Projects\AI Based Projects\ecourtcase-comic\comic-court-case"
npm run server:dev
```

You should see:
```
🚀 Server running on http://localhost:3000
📁 Upload directory: ...
```

**Keep this terminal open!** The server must stay running.

### 2. Start the Frontend (if not already running)

In **another terminal window**, run:

```bash
cd "D:\All Projects\AI Based Projects\ecourtcase-comic\comic-court-case"
npm run dev
```

You should see:
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:8080/
```

### 3. Or Use the Combined Command

Instead of two terminals, you can use one:

```bash
npm start
```

This starts both servers together.

## Verify Server is Running

Open your browser and go to:
- **Backend Health Check:** http://localhost:3000/health
- **Frontend:** http://localhost:8080

If you see `{"status":"ok"}` at `/health`, the server is working!

## Common Issues

### "Failed to fetch" Error
- **Cause:** Backend server not running
- **Fix:** Start the server with `npm run server:dev`

### "Cannot connect to database"
- **Cause:** Wrong database credentials in `.env`
- **Fix:** Check your `.env` file has correct DB credentials

### Port Already in Use
- **Cause:** Another server is using port 3000
- **Fix:** 
  ```powershell
  # Find and kill the process
  netstat -ano | findstr ":3000"
  # Then kill the PID shown
  taskkill /PID <PID_NUMBER> /F
  ```

## Test Login Credentials

After starting the server, you can use test credentials from `TEST_CREDENTIALS.md`:

- **Admin:** admin@test.com / Admin@123
- **Judge:** judge@test.com / Judge@123
- **User:** regular_user@test.com / User@123

Or create test data:
```bash
npm run create-test-data
```

