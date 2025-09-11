const { exec } = require('child_process');
const path = require('path');

console.log('Running site migration to add region, state, and siteCode fields...');

// Run the migration script
exec('node server/migrations/add-site-fields.js', {
  cwd: __dirname,
  env: { ...process.env }
}, (error, stdout, stderr) => {
  if (error) {
    console.error('Migration failed:', error);
    return;
  }
  
  if (stderr) {
    console.error('Migration stderr:', stderr);
  }
  
  console.log('Migration output:', stdout);
  console.log('Migration completed!');
});





