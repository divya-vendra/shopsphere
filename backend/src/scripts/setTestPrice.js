/**
 * Set a single sample product's price to 1 (INR) for payment testing.
 * Usage: node src/scripts/setTestPrice.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product.model');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  // Try to find a clear sample product first
  let product = await Product.findOne({ name: /Premium Wireless Headphones/i });
  if (!product) {
    // Fallback: first active product
    product = await Product.findOne({}).sort({ createdAt: 1 });
  }

  if (!product) {
    console.error('No product found to update.');
    process.exit(1);
  }

  console.log('Before:', {
    id:    product._id.toString(),
    name:  product.name,
    slug:  product.slug,
    price: product.price,
  });

  product.price = 1; // 1 rupee for test
  await product.save();

  console.log('After:', {
    id:    product._id.toString(),
    name:  product.name,
    slug:  product.slug,
    price: product.price,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

