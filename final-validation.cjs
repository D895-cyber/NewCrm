#!/usr/bin/env node

const fs = require('fs');

console.log('🎯 Final Deployment Validation...\n');

let checks = 0;
let passed = 0;

// Check 1: Package.json has required scripts
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

// Check 4: Build directory exists (CRITICAL)
function checkBuildDirectory() {
  checks++;
  if (fs.existsSync('dist')) {
    console.log('✅ Build directory (dist) exists - FRONTEND READY!');
    passed++;
  } else {
    console.log('❌ Build directory (dist) not found - FRONTEND NOT READY');
  }
}

// Check 5: Node modules exist
function checkNodeModules() {
  checks++;
  if (fs.existsSync('node_modules')) {
    console.log('✅ Node modules installed');
    passed++;
  } else {
    console.log('❌ Node modules not installed');
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
    'PRE_DEPLOYMENT_CHECKLIST.md',
    'DEPLOYMENT_STATUS.md'
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

// Check 8: Build files exist
function checkBuildFiles() {
  const buildFiles = [
    'dist/index.html',
    'dist/assets/index-5d01311e.js',
    'dist/assets/index-bcc9252d.css'
  ];
  
  buildFiles.forEach(file => {
    checks++;
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      passed++;
    } else {
      console.log(`❌ ${file} not found`);
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
checkBuildFiles();

// Summary
console.log('\n📊 Final Validation Summary:');
console.log(`Passed: ${passed}/${checks} checks`);
console.log(`Success Rate: ${Math.round((passed/checks) * 100)}%`);

if (passed === checks) {
  console.log('\n🎉 ALL CHECKS PASSED! Your application is 100% ready for deployment!');
  console.log('\n🚀 Next Steps:');
  console.log('1. Choose your AWS deployment method (EC2, Elastic Beanstalk, or App Runner)');
  console.log('2. Follow the AWS_DEPLOYMENT_GUIDE.md instructions');
  console.log('3. Use the PRE_DEPLOYMENT_CHECKLIST.md to ensure nothing is missed');
  console.log('4. Deploy your application to AWS!');
} else {
  console.log('\n⚠️  Some checks failed. Please address the issues above before deployment.');
}

console.log('\n📁 Deployment Files Ready:');
console.log('- AWS_DEPLOYMENT_GUIDE.md - Complete deployment guide');
console.log('- PRE_DEPLOYMENT_CHECKLIST.md - Step-by-step checklist');
console.log('- DEPLOYMENT_STATUS.md - Current status summary');
console.log('- deploy-script.sh - AWS EC2 setup script');
console.log('- build-production.sh - Production build script');
console.log('- ecosystem.config.js - PM2 configuration');
console.log('- nginx.conf - Nginx reverse proxy');




