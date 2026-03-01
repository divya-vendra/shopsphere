/**
 * Database Seeder
 * Usage:
 *   node src/scripts/seed.js --import   (seed DB with sample data)
 *   node src/scripts/seed.js --destroy  (wipe all collections)
 *
 * DEVELOPMENT ONLY — never run against production.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User.model');
const Product  = require('../models/Product.model');
const Order    = require('../models/Order.model');
const Cart     = require('../models/Cart.model');
const Review   = require('../models/Review.model');

// ── Sample data ───────────────────────────────────────────────────────────────

const users = [
  {
    name:     'Admin User',
    email:    'admin@shopsphere.com',
    password: 'Admin1234',
    role:     'admin',
  },
  {
    name:     'Jane Customer',
    email:    'jane@example.com',
    password: 'Customer1',
    role:     'customer',
  },
  {
    name:     'John Doe',
    email:    'john@example.com',
    password: 'Customer1',
    role:     'customer',
  },
];

const products = [
  {
    name:        'Premium Wireless Headphones',
    description: 'Immersive sound experience with active noise cancellation. 30-hour battery life, premium leather earcups, and foldable design for travel.',
    price:       199.99,
    comparePrice: 249.99,
    category:   'Electronics',
    brand:      'SoundWave',
    stock:      45,
    isFeatured: true,
    tags:       ['wireless', 'audio', 'noise-cancelling'],
    images:     [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', publicId: 'seed_1' }],
  },
  {
    name:        'Running Sneakers Pro',
    description: 'Lightweight carbon-fibre plate construction for maximum energy return. Breathable mesh upper with dynamic lacing system.',
    price:       129.95,
    comparePrice: 159.95,
    category:   'Footwear',
    brand:      'SpeedFit',
    stock:      80,
    isFeatured: true,
    tags:       ['running', 'sports', 'lightweight'],
    images:     [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', publicId: 'seed_2' }],
  },
  {
    name:        'Smart Watch Series 5',
    description: 'Always-on OLED display, GPS, heart rate monitor, sleep tracking, and 7-day battery life.',
    price:       299.00,
    category:   'Electronics',
    brand:      'TechTime',
    stock:      30,
    isFeatured: true,
    tags:       ['smartwatch', 'fitness', 'wearable'],
    images:     [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', publicId: 'seed_3' }],
  },
  {
    name:        'Classic Leather Wallet',
    description: 'Hand-stitched full-grain leather, RFID blocking, 8 card slots and a bill compartment.',
    price:       49.99,
    category:   'Clothing',
    brand:      'LeatherCraft',
    stock:      120,
    tags:       ['wallet', 'leather', 'rfid'],
    images:     [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', publicId: 'seed_4' }],
  },
  {
    name:        'Mechanical Keyboard TKL',
    description: 'Tenkeyless layout, Cherry MX Red switches, per-key RGB backlight, aluminium top frame.',
    price:       149.99,
    comparePrice: 179.99,
    category:   'Electronics',
    brand:      'KeyMaster',
    stock:      25,
    tags:       ['keyboard', 'mechanical', 'rgb', 'gaming'],
    images:     [{ url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600', publicId: 'seed_5' }],
  },
  {
    name:        'Yoga Mat Premium',
    description: '6mm thick non-slip natural rubber yoga mat with alignment lines. Eco-friendly, sweat-resistant surface.',
    price:       59.99,
    category:   'Sports',
    brand:      'ZenFlex',
    stock:      200,
    tags:       ['yoga', 'fitness', 'eco'],
    images:     [{ url: 'https://images.unsplash.com/photo-1601925228209-ce1b3f61c703?w=600', publicId: 'seed_6' }],
  },
  {
    name:        'Skincare Essentials Kit',
    description: 'Complete morning and evening routine — vitamin C serum, hyaluronic acid moisturiser, SPF 50 sunscreen.',
    price:       89.00,
    category:   'Beauty',
    brand:      'GlowLab',
    stock:      60,
    isFeatured: true,
    tags:       ['skincare', 'beauty', 'serum'],
    images:     [{ url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', publicId: 'seed_7' }],
  },
  {
    name:        'Backpack Explorer 30L',
    description: '30-litre waterproof hiking pack with laptop compartment, hydration sleeve, and reflective strips.',
    price:       79.99,
    comparePrice: 99.99,
    category:   'Sports',
    brand:      'TrailBlazer',
    stock:      55,
    tags:       ['backpack', 'hiking', 'travel'],
    images:     [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', publicId: 'seed_8' }],
  },
  // Home & Garden
  {
    name:        'Ceramic Planter Set',
    description: 'Set of 3 terracotta ceramic planters with drainage holes. Handcrafted, ideal for succulents and herbs. Includes matching saucers.',
    price:       34.99,
    comparePrice: 44.99,
    category:   'Home & Garden',
    brand:      'GreenLeaf',
    stock:      90,
    isFeatured: true,
    tags:       ['planters', 'home', 'succulents'],
    images:     [{ url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600', publicId: 'seed_9' }],
  },
  // Books
  {
    name:        'The Complete Developer Handbook',
    description: 'A comprehensive guide to modern full-stack development. Covers React, Node.js, databases, and deployment. 400+ pages with code examples.',
    price:       39.99,
    category:   'Books',
    brand:      'TechPress',
    stock:      150,
    tags:       ['programming', 'development', 'reference'],
    images:     [{ url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', publicId: 'seed_10' }],
  },
  // Toys
  {
    name:        'Building Blocks Set 500pc',
    description: '500-piece interlocking building blocks set. Compatible with major brands. Includes storage tub and idea booklet. Ages 4+. BPA-free.',
    price:       29.99,
    comparePrice: 39.99,
    category:   'Toys',
    brand:      'BlockMaster',
    stock:      120,
    isFeatured: true,
    tags:       ['blocks', 'creative', 'kids'],
    images:     [{ url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600', publicId: 'seed_11' }],
  },
  // Automotive
  {
    name:        'Car Phone Mount Pro',
    description: 'Universal dashboard and vent phone holder. One-hand release, 360° rotation, strong grip. Fits all smartphones up to 6.7".',
    price:       24.99,
    category:   'Automotive',
    brand:      'DriveSafe',
    stock:      200,
    tags:       ['phone mount', 'car', 'accessories'],
    images:     [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', publicId: 'seed_12' }],
  },
  // Other
  {
    name:        'Premium Gift Box Set',
    description: 'Elegant gift box set with tissue paper, ribbon, and thank-you card. Perfect for corporate or personal gifting. Recyclable materials.',
    price:       19.99,
    category:   'Other',
    brand:      'WrapIt',
    stock:      300,
    tags:       ['gift', 'packaging', 'occasion'],
    images:     [{ url: 'https://images.unsplash.com/photo-1513885535751-8c9235bd342a?w=600', publicId: 'seed_13' }],
  },
];

// ── Import ────────────────────────────────────────────────────────────────────
const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    await Promise.all([
      User.deleteMany(), Product.deleteMany(),
      Order.deleteMany(), Cart.deleteMany(), Review.deleteMany(),
    ]);
    console.log('Cleared existing data.');

    // Create users (pre-hash passwords so bcrypt hook runs)
    const createdUsers = await User.create(users);
    const adminUser    = createdUsers.find((u) => u.role === 'admin');
    console.log(`Created ${createdUsers.length} users.`);

    // Create products with admin as creator
    const productData = products.map((p) => ({ ...p, createdBy: adminUser._id }));
    await Product.create(productData);
    console.log(`Created ${products.length} products.`);

    console.log('\n✅ Database seeded successfully!');
    console.log('─────────────────────────────────');
    console.log('Admin:    admin@shopsphere.com / Admin1234');
    console.log('Customer: jane@example.com / Customer1');
    console.log('─────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

// ── Destroy ───────────────────────────────────────────────────────────────────
const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([
      User.deleteMany(), Product.deleteMany(),
      Order.deleteMany(), Cart.deleteMany(), Review.deleteMany(),
    ]);
    console.log('✅ All data destroyed.');
    process.exit(0);
  } catch (err) {
    console.error('Destroy failed:', err.message);
    process.exit(1);
  }
};

if (process.argv[2] === '--import')  importData();
if (process.argv[2] === '--destroy') destroyData();
