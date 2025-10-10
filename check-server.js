const http = require('http');

console.log('🔍 Checking backend server...\n');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/html-to-pdf/templates',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Backend server is running!`);
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Endpoint: http://localhost:4000/api/html-to-pdf/templates\n`);
  
  if (res.statusCode === 401) {
    console.log('⚠️  Authentication required (401)');
    console.log('   This is normal - you need to be logged in\n');
  } else if (res.statusCode === 200) {
    console.log('✅ API endpoint is accessible!\n');
  }
});

req.on('error', (error) => {
  console.log('❌ Backend server is NOT running!');
  console.log(`   Error: ${error.message}\n`);
  console.log('🔧 Fix: Start the backend server');
  console.log('   Open a new terminal and run:');
  console.log('   cd backend');
  console.log('   npm start\n');
});

req.end();







