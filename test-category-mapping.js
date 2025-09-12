// Test category mapping logic
const categoryFolderMap = {
  'Before Service': 'before-service',
  'During Service': 'during-service', 
  'After Service': 'after-service',
  'Spare Parts': 'spare-parts',
  'RMA': 'rma',
  'Issue Found': 'issues',
  'Parts Used': 'parts-used',
  'Service Photos': 'service-photos',
  'BEFORE': 'before-service',
  'DURING': 'during-service',
  'AFTER': 'after-service',
  'ISSUE': 'issues',
  'PARTS': 'parts-used',
  'Other': 'other'
};

// Test different category inputs
const testCategories = [
  'Before Service',
  'BEFORE',
  'During Service',
  'DURING',
  'After Service',
  'AFTER',
  'Unknown Category'
];

console.log('Testing category mapping:');
testCategories.forEach(category => {
  const folderName = categoryFolderMap[category] || 'other';
  console.log(`"${category}" -> "${folderName}"`);
});

// Test the exact string from the API
const apiCategory = 'Before Service';
const result = categoryFolderMap[apiCategory] || 'other';
console.log(`\nAPI Category "${apiCategory}" -> "${result}"`);
