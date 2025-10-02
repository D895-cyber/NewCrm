#!/usr/bin/env node

/**
 * Local Deployment Test Script
 * Tests the connection between frontend build and backend
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4000';
const FRONTEND_DIST_PATH = path.resolve(__dirname, 'frontend/dist');

console.log('🧪 Testing Local Frontend-Backend Connection\n');

// Test functions
const tests = [
  {
    name: 'Frontend Build Exists',
    test: () => {
      const indexPath = path.join(FRONTEND_DIST_PATH, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('✅ Frontend dist/index.html exists');
        return true;
      } else {
        console.log('❌ Frontend dist/index.html not found');
        console.log(`   Expected at: ${indexPath}`);
        return false;
      }
    }
  },
  {
    name: 'Backend Health Check',
    test: async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/health`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend health check passed');
          console.log(`   Status: ${data.status}`);
          console.log(`   Database: ${data.database}`);
          return true;
        } else {
          console.log('❌ Backend health check failed');
          console.log(`   Status: ${response.status}`);
          return false;
        }
      } catch (error) {
        console.log('❌ Backend not reachable');
        console.log(`   Error: ${error.message}`);
        return false;
      }
    }
  },
  {
    name: 'Frontend Serving',
    test: async () => {
      try {
        const response = await fetch(`${BASE_URL}/`);
        if (response.ok) {
          const html = await response.text();
          if (html.includes('<div id="root">')) {
            console.log('✅ Frontend is being served correctly');
            return true;
          } else {
            console.log('❌ Frontend HTML doesn\'t contain React root');
            return false;
          }
        } else {
          console.log('❌ Frontend not accessible');
          console.log(`   Status: ${response.status}`);
          return false;
        }
      } catch (error) {
        console.log('❌ Frontend serving failed');
        console.log(`   Error: ${error.message}`);
        return false;
      }
    }
  },
  {
    name: 'API Routes Working',
    test: async () => {
      const apiRoutes = [
        '/api/sites',
        '/api/projectors', 
        '/api/fse',
        '/api/rma',
        '/api/report-templates'
      ];
      
      let allPassed = true;
      
      for (const route of apiRoutes) {
        try {
          const response = await fetch(`${BASE_URL}${route}`);
          if (response.status === 200 || response.status === 401) {
            console.log(`✅ ${route} - accessible`);
          } else {
            console.log(`❌ ${route} - status ${response.status}`);
            allPassed = false;
          }
        } catch (error) {
          console.log(`❌ ${route} - error: ${error.message}`);
          allPassed = false;
        }
      }
      
      return allPassed;
    }
  },
  {
    name: 'SPA Routing Test',
    test: async () => {
      const spaRoutes = [
        '/',
        '/dashboard',
        '/sites',
        '/projectors',
        '/rma'
      ];
      
      let allPassed = true;
      
      for (const route of spaRoutes) {
        try {
          const response = await fetch(`${BASE_URL}${route}`);
          if (response.ok) {
            const html = await response.text();
            if (html.includes('<div id="root">')) {
              console.log(`✅ SPA route ${route} - serving React app`);
            } else {
              console.log(`❌ SPA route ${route} - not serving React app`);
              allPassed = false;
            }
          } else {
            console.log(`❌ SPA route ${route} - status ${response.status}`);
            allPassed = false;
          }
        } catch (error) {
          console.log(`❌ SPA route ${route} - error: ${error.message}`);
          allPassed = false;
        }
      }
      
      return allPassed;
    }
  }
];

// Run tests
async function runTests() {
  console.log('Starting tests...\n');
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    try {
      const result = await test.test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your local deployment is working correctly.');
    console.log(`\n🌐 Access your application at: ${BASE_URL}`);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for issues.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure backend server is running: cd backend/server && npm start');
    console.log('   2. Make sure frontend is built: cd frontend && npm run build');
    console.log('   3. Check that dist folder exists in frontend/');
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you need to install node-fetch');
  console.log('   Run: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
