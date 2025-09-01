#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Deployment Readiness...\n');

let checks = 0;
let passed = 0;

// Check 1: Package.json exists and has required scripts
function checkPackageJson() {
  checks++;
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.start) {
      console.log('✅ Package.json has start script');
      passed++;
    } else {
      console.log('❌ Package.json missing start script');
    }
    
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('✅ Package.json has build script');
      passed++;
    } else {
      console.log('❌ Package.json missing build script');
    }
    
    checks++;
  } catch (error) {
    console.log('❌ Package.json not found or invalid');
  }
}

// Check 2: Environment file exists
function checkEnvironmentFile() {
  checks++;
  if (fs.existsSync('.env')) {
    console.log('✅ Environment file (.env) exists');
    passed++;
  } else {
    console.log('❌ Environment file (.env) not found');
  }
}

// Check 3: Server directory exists
function checkServerDirectory() {
  checks++;
  if (fs.existsSync('server')) {
    console.log('✅ Server directory exists');
    passed++;
  } else {
    console.log('❌ Server directory not found');
  }
}

// Check 4: Build directory exists (if built)
function checkBuildDirectory() {
  checks++;
  if (fs.existsSync('dist')) {
    console.log('✅ Build directory (dist) exists');
    passed++;
  } else {
    console.log('⚠️  Build directory (dist) not found - run npm run build first');
  }
}

// Check 5: Node modules exist
function checkNodeModules() {
  checks++;
  if (fs.existsSync('node_modules')) {
    console.log('✅ Node modules installed');
    passed++;
  } else {
    console.log('❌ Node modules not installed - run npm install');
  }
}

// Check 6: Required files exist
function checkRequiredFiles() {
  const requiredFiles = [
    'server/index.js',
    'server/models/Site.js',
    'src/components/pages/SitesPage.tsx',
    'src/utils/config.ts'
  ];
  
  requiredFiles.forEach(file => {
    checks++;
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      passed++;
    } else {
      console.log(`❌ ${file} not found`);
    }
  });
}

// Check 7: Deployment files exist
function checkDeploymentFiles() {
  const deploymentFiles = [
    'deploy-script.sh',
    'build-production.sh',
    'ecosystem.config.js',
    'nginx.conf',
    'AWS_DEPLOYMENT_GUIDE.md',
    'PRE_DEPLOYMENT_CHECKLIST.md'
  ];
  
  deploymentFiles.forEach(file => {
    checks++;
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      passed++;
    } else {
      console.log(`⚠️  ${file} not found`);
    }
  });
}

// Run all checks
checkPackageJson();
checkEnvironmentFile();
checkServerDirectory();
checkBuildDirectory();
checkNodeModules();
checkRequiredFiles();
checkDeploymentFiles();

// Summary
console.log('\n📊 Validation Summary:');
console.log(`Passed: ${passed}/${checks} checks`);
console.log(`Success Rate: ${Math.round((passed/checks) * 100)}%`);

if (passed === checks) {
  console.log('\n🎉 All checks passed! Your application is ready for deployment.');
} else {
  console.log('\n⚠️  Some checks failed. Please address the issues above before deployment.');
}

console.log('\n📋 Next Steps:');
console.log('1. Review the PRE_DEPLOYMENT_CHECKLIST.md file');
console.log('2. Complete all checklist items');
console.log('3. Test your application thoroughly');
console.log('4. Choose your AWS deployment method');
console.log('5. Follow the AWS_DEPLOYMENT_GUIDE.md instructions');




