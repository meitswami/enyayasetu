# Vercel 404 Troubleshooting Guide

## Current Issue
Getting 404 errors for `/api/*` endpoints on Vercel.

## Possible Causes & Solutions

### 1. Check Vercel Deployment Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the "Functions" tab
4. Look for any build errors or warnings

### 2. Verify File Structure
Make sure you have:
```
your-project/
├── api/
│   └── index.js  ← This should exist
├── vercel.json
└── package.json
```

### 3. Check Build Output
In Vercel deployment logs, verify:
- `api/index.js` is being built
- No errors during the build process
- The function is listed in the Functions tab

### 4. Test the Function Directly
After deployment, try accessing:
- `https://enyayasetu.vercel.app/api` (should return JSON)
- `https://enyayasetu.vercel.app/health` (should return `{"status":"ok"}`)

### 5. Alternative: Use Individual Route Files
If `api/index.js` doesn't work, try creating individual files:

```
api/
├── auth/
│   └── signin.js
├── auth/
│   └── signup.js
└── cases/
    └── [id].js
```

But this is more complex. Let's try fixing the current setup first.

### 6. Check Environment Variables
Make sure all required environment variables are set in Vercel:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET
- etc.

### 7. Verify vercel.json
The current `vercel.json` should be:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/health",
      "destination": "/api"
    }
  ]
}
```

### 8. Check if Function is Deployed
In Vercel Dashboard:
1. Go to your project
2. Click "Functions" tab (if available)
3. You should see `api/index.js` listed

If it's not there, the function isn't being recognized.

## Next Steps

1. **Commit and push the updated `vercel.json`**
2. **Check Vercel deployment logs**
3. **Verify the function appears in Functions tab**
4. **Test `/api` endpoint directly**

If still not working, we may need to:
- Create individual route files in `api/` folder
- Or use a different deployment approach
