/**
 * Index Verification Script
 * Run after deployment to confirm all required indexes exist.
 * Usage: node src/scripts/verifyIndexes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

// Import models to trigger schema registration (which creates indexes)
require('../models/User.model');
require('../models/Product.model');
require('../models/Order.model');
require('../models/Review.model');
require('../models/Cart.model');
require('../models/Wishlist.model');
require('../models/WebhookEvent.model');

const EXPECTED_INDEXES = {
  users: [
    'email_1',
  ],
  products: [
    'slug_1',
    'category_1_price_1',
    'isActive_1_isFeatured_1',
    'product_text_search',
  ],
  orders: [
    'user_1_createdAt_-1',
    'stripeSessionId_1',
    'orderStatus_1_createdAt_-1',
    'paymentStatus_1',
  ],
  reviews: [
    'user_1_product_1',
    'product_1_createdAt_-1',
  ],
  webhookevents: [
    'stripeEventId_1',
    'processedAt_1',
  ],
};

async function verifyIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  let allPassed = true;

  for (const [collection, expectedIndexNames] of Object.entries(EXPECTED_INDEXES)) {
    const col     = mongoose.connection.collection(collection);
    const indexes = await col.indexes();
    const existing = indexes.map((idx) => idx.name);

    console.log(`📁 ${collection}`);

    for (const name of expectedIndexNames) {
      if (existing.includes(name)) {
        console.log(`  ✅ ${name}`);
      } else {
        console.log(`  ❌ MISSING: ${name}`);
        allPassed = false;
      }
    }
    console.log();
  }

  if (allPassed) {
    console.log('✅ All required indexes are present.');
  } else {
    console.log('⚠️  Some indexes are missing. Run the app once to trigger Mongoose index creation.');
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}

verifyIndexes().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
