#!/usr/bin/env node

const axios = require('axios');

async function testActiveShipmentsAPI() {
  console.log('🎯 Testing Active Shipments API');
  console.log('================================\n');

  try {
    console.log('🔍 Making API call to /api/rma/tracking/active...');
    
    const response = await axios.get('http://localhost:4000/api/rma/tracking/active');
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.shipments) {
      console.log('\n📦 Active Shipments Found:', response.data.shipments.length);
      
      if (response.data.shipments.length > 0) {
        console.log('\n🚚 Shipment Details:');
        response.data.shipments.forEach((shipment, index) => {
          console.log(`\n  Shipment ${index + 1}:`);
          console.log(`    RMA Number: ${shipment.rmaNumber}`);
          console.log(`    Site Name: ${shipment.siteName}`);
          console.log(`    Product Name: ${shipment.productName}`);
          console.log(`    Has Outbound: ${!!shipment.outbound}`);
          console.log(`    Has Return: ${!!shipment.return}`);
          
          if (shipment.outbound) {
            console.log(`    Outbound Tracking: ${shipment.outbound.trackingNumber}`);
            console.log(`    Outbound Carrier: ${shipment.outbound.carrier}`);
            console.log(`    Outbound Status: ${shipment.outbound.status}`);
          }
          
          if (shipment.return) {
            console.log(`    Return Tracking: ${shipment.return.trackingNumber}`);
            console.log(`    Return Carrier: ${shipment.return.carrier}`);
            console.log(`    Return Status: ${shipment.return.status}`);
          }
        });
      } else {
        console.log('\n❌ No active shipments found');
        console.log('This means either:');
        console.log('1. No RMAs have tracking numbers');
        console.log('2. The database query is not finding RMAs with tracking');
        console.log('3. The processing logic is not working correctly');
      }
    } else {
      console.log('\n❌ Invalid response structure');
      console.log('Expected: { success: true, shipments: [...] }');
      console.log('Got:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error calling API:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
      console.error('Make sure to run: cd backend/server && npm run dev');
    }
  }
}

// Run the test
testActiveShipmentsAPI();












