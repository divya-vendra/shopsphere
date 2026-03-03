/**
 * One-time script to convert product prices from USD to INR.
 * It multiplies `price` and `comparePrice` by the given rate.
 *
 * Usage:
 *   node src/scripts/convertPricesToINR.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const RATE = 83; // approximate INR per 1 USD — adjust if needed

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const products = mongoose.connection.db.collection('products');

  // Multiply price for all products
  const priceResult = await products.updateMany(
    { price: { $type: 'double' } },
    { $mul: { price: RATE } }
  );

  // Multiply comparePrice only where it's a number
  const compareResult = await products.updateMany(
    { comparePrice: { $type: 'double' } },
    { $mul: { comparePrice: RATE } }
  );

  console.log(
    'Price - matched:', priceResult.matchedCount,
    'modified:', priceResult.modifiedCount
  );
  console.log(
    'ComparePrice - matched:', compareResult.matchedCount,
    'modified:', compareResult.modifiedCount
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

