/**
 * Promote a user to admin by email.
 * Usage: node src/scripts/makeAdmin.js <email>
 * Example: node src/scripts/makeAdmin.js you@example.com
 *
 * DEVELOPMENT ONLY — ensures you have at least one admin for testing.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User.model');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node src/scripts/makeAdmin.js <email>');
  process.exit(1);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  console.log(`Updated ${user.email} to role: ${user.role}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
