const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Quick Server Test');
console.log('==================');

// Start the server
console.log('🚀 Starting server...');
const serverProcess = spawn('node', ['backend/server/index.js'], {
  stdio: 'pipe',
  cwd: process.cwd()
});

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('📡 Server:', output.trim());
});

serverProcess.stderr.on('data', (data) => {
  console.log('❌ Server Error:', data.toString().trim());
});

// Wait for server to start, then test
setTimeout(async () => {
  console.log('\n🔍 Testing server endpoints...');
  
  const tests = [
    { url: 'http://localhost:4000/', name: 'Root path (should serve React app)' },
    { url: 'http://localhost:4000/api/health', name: 'Health check API' },
    { url: 'http://localhost:4000/dashboard', name: 'Dashboard route (SPA)' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`🌐 URL: ${test.url}`);
      
      const response = await fetch(test.url);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
      
      if (test.url.includes('/api/')) {
        const json = await response.json();
        console.log(`📝 Response: ${JSON.stringify(json, null, 2)}`);
      } else {
        const text = await response.text();
        const isHtml = text.includes('<html') || text.includes('<div id="root">');
        console.log(`📄 Is HTML: ${isHtml}`);
        console.log(`📏 Content length: ${text.length} chars`);
        if (isHtml) {
          console.log('✅ Serving HTML content (likely React app)');
        } else {
          console.log('❌ Not serving HTML content');
          console.log('📄 First 200 chars:', text.substring(0, 200));
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🛑 Stopping server...');
  serverProcess.kill();
  
}, 5000); // Wait 5 seconds for server to start

// Handle process exit
serverProcess.on('exit', (code) => {
  console.log(`\n📊 Server exited with code: ${code}`);
  process.exit(0);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n🛑 Terminating test...');
  serverProcess.kill();
  process.exit(0);
});
