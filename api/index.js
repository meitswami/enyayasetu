// Vercel Serverless Function Entry Point
// This wraps the Express app for Vercel's serverless environment

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Error handling middleware (early - catches all errors)
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: err.message || 'Internal server error',
    type: err.name || 'Error'
  });
});

// Serve uploaded files (if needed - Vercel uses /tmp for serverless)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Import routes
import authRoutes from '../server/routes/auth.js';
import caseRoutes from '../server/routes/cases.js';
import paymentRoutes from '../server/routes/payments.js';
import aiRoutes from '../server/routes/ai.js';
import evidenceRoutes from '../server/routes/evidence.js';
import courtRoutes from '../server/routes/court.js';
import invoiceRoutes from '../server/routes/invoices.js';
import addonRoutes from '../server/routes/addons.js';
import caseStrengthRoutes from '../server/routes/case-strength.js';
import rtiRoutes from '../server/routes/rti.js';
import authenticatorRoutes from '../server/routes/authenticator.js';

// API Routes
// Note: In Vercel, when request comes to /api/auth/signin, 
// Vercel routes it to this function, and Express receives the full path
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/court', courtRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/case-strength', caseStrengthRoutes);
app.use('/api/rti', rtiRoutes);
app.use('/api/authenticator', authenticatorRoutes);

// Debug route to test if function is working
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.path, req.url);
  next();
});

// Root API endpoint (informational)
app.get('/api', (req, res) => {
  res.json({
    message: 'API Server is running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      cases: '/api/cases',
      payments: '/api/payments',
      addons: '/api/addons',
      caseStrength: '/api/case-strength',
      rti: '/api/rti',
    },
    timestamp: new Date().toISOString()
  });
});

// Health check (accessible at /api/health in Vercel)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint for the serverless function
app.get('/', (req, res) => {
  res.json({
    message: 'API Server is running',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      cases: '/api/cases',
      payments: '/api/payments',
      addons: '/api/addons',
      caseStrength: '/api/case-strength',
      rti: '/api/rti',
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check environment variables (for debugging)
app.get('/api/test-env', (req, res) => {
  res.json({
    env: {
      dbHost: process.env.DB_HOST ? 'SET' : 'NOT SET',
      dbUser: process.env.DB_USER ? 'SET' : 'NOT SET',
      dbName: process.env.DB_NAME ? 'SET' : 'NOT SET',
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      vercel: process.env.VERCEL ? 'YES' : 'NO'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Express Error Middleware:', err);
  console.error('Error Stack:', err.stack);
  console.error('Error Name:', err.name);
  console.error('Error Code:', err.code);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    type: err.name || 'Error',
    code: err.code
  });
});

// Export the Express app for Vercel
// This is the handler that Vercel will call for /api/* requests
export default app;

// For Vercel compatibility, also export as handler
export const handler = app;
