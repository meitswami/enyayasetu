// Startup script that ensures backend starts before frontend
import { spawn } from 'child_process';
import http from 'http';

const BACKEND_PORT = process.env.API_PORT || 3000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

console.log('🚀 Starting application...\n');

// Start backend server
console.log('📦 Starting backend server...');
const backend = spawn('npm', ['run', 'server:dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// Wait for backend to be ready
function waitForBackend(maxAttempts = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('\n✅ Backend server is ready!\n');
          resolve();
        } else {
          if (attempts < maxAttempts) {
            setTimeout(check, delay);
          } else {
            reject(new Error('Backend failed to start'));
          }
        }
      });
      
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, delay);
        } else {
          reject(new Error('Backend failed to start'));
        }
      });
      
      req.setTimeout(1000, () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(check, delay);
        } else {
          reject(new Error('Backend failed to start'));
        }
      });
    };
    
    // Wait a bit before first check
    setTimeout(check, 2000);
  });
}

// Start frontend after backend is ready
waitForBackend()
  .then(() => {
    console.log('🌐 Starting frontend server...\n');
    const frontend = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down servers...');
      backend.kill();
      frontend.kill();
      process.exit();
    });
    
    process.on('SIGTERM', () => {
      backend.kill();
      frontend.kill();
      process.exit();
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start backend:', error.message);
    backend.kill();
    process.exit(1);
  });

// Handle backend errors
backend.on('error', (error) => {
  console.error('❌ Backend process error:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Backend process exited with code ${code}`);
    process.exit(code);
  }
});

