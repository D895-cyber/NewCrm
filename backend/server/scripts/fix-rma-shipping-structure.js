#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import the RMA model
const RMA = require('../models/RMA');

async function fixRMAShippingStructure() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_warranty');
    console.log('✅ Connected to MongoDB');

    // Find all RMAs that don't have the shipping structure
    const rmasWithoutShipping = await RMA.find({
      $or: [
        { 'shipping.outbound': { $exists: false } },
        { 'shipping.return': { $exists: false } }
      ]
    });

    console.log(`📦 Found ${rmasWithoutShipping.length} RMAs without proper shipping structure`);

    if (rmasWithoutShipping.length === 0) {
      console.log('✅ All RMAs already have proper shipping structure');
      return;
    }

    // Update each RMA to have the proper shipping structure
    for (const rma of rmasWithoutShipping) {
      console.log(`🔧 Fixing RMA: ${rma.rmaNumber}`);

      // Initialize shipping structure if it doesn't exist
      if (!rma.shipping) {
        rma.shipping = {};
      }

      // Initialize outbound shipping if it doesn't exist
      if (!rma.shipping.outbound) {
        rma.shipping.outbound = {
          trackingNumber: rma.trackingNumber || '',
          carrier: rma.shippedThru || '',
          status: 'pending',
          lastUpdated: new Date()
        };
      }

      // Initialize return shipping if it doesn't exist
      if (!rma.shipping.return) {
        rma.shipping.return = {
          trackingNumber: rma.rmaReturnTrackingNumber || '',
          carrier: rma.rmaReturnShippedThru || '',
          status: 'pending',
          lastUpdated: new Date()
        };
      }

      // Set shipped date if available
      if (rma.shippedDate && !rma.shipping.outbound.shippedDate) {
        rma.shipping.outbound.shippedDate = rma.shippedDate;
      }

      if (rma.rmaReturnShippedDate && !rma.shipping.return.shippedDate) {
        rma.shipping.return.shippedDate = rma.rmaReturnShippedDate;
      }

      // Save the updated RMA
      await rma.save();
      console.log(`✅ Updated RMA: ${rma.rmaNumber}`);
    }

    console.log(`🎉 Successfully fixed ${rmasWithoutShipping.length} RMAs`);

    // Verify the fix
    const remainingRMAs = await RMA.find({
      $or: [
        { 'shipping.outbound': { $exists: false } },
        { 'shipping.return': { $exists: false } }
      ]
    });

    if (remainingRMAs.length === 0) {
      console.log('✅ All RMAs now have proper shipping structure');
    } else {
      console.log(`⚠️ ${remainingRMAs.length} RMAs still need fixing`);
    }

  } catch (error) {
    console.error('❌ Error fixing RMA shipping structure:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  fixRMAShippingStructure();
}

module.exports = fixRMAShippingStructure;

