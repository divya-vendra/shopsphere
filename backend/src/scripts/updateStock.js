/**
 * Set stock to 10 for products with missing or zero stock.
 * Usage: node src/scripts/updateStock.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const result = await mongoose.connection.db
    .collection('products')
    .updateMany(
      { $or: [ { stock: { $exists: false } }, { stock: { $lte: 0 } } ] },
      { $set: { stock: 10 } }
    );
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
