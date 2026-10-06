const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Product } = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const sampleUsers = [
  {
    name: 'Administrator Demo',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Inventory Staff Demo',
    email: 'staff@example.com',
    password: 'Staff@123',
    role: 'staff',
  },
];

const sampleProducts = [
  {
    name: 'MacBook Pro 16-inch M3 Max',
    category: 'Electronics',
    price: 2499.0,
    stockQuantity: 14,
    description: 'High-performance workstation laptop with 16-core CPU, 40-core GPU, Liquid Retina XDR display, and 36GB unified memory.',
  },
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    category: 'Electronics',
    price: 99.99,
    stockQuantity: 45,
    description: 'Ergonomic performance mouse with 8K DPI any-surface sensor, ultra-quiet clicks, and MagSpeed electromagnetic scrolling.',
  },
  {
    name: 'Keychron Q1 Pro Mechanical Keyboard',
    category: 'Electronics',
    price: 199.5,
    stockQuantity: 4,
    description: 'Custom QMK/VIA wireless mechanical keyboard with CNC aluminum body, hot-swappable switches, and double-gasket design.',
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB',
    category: 'Electronics',
    price: 1299.99,
    stockQuantity: 9,
    description: 'Flagship smartphone featuring titanium frame, 200MP camera system, integrated S-Pen stylus, and Galaxy AI productivity tools.',
  },
  {
    name: 'Sony WH-1000XM5 Noise Canceling Headphones',
    category: 'Electronics',
    price: 349.99,
    stockQuantity: 18,
    description: 'Industry-leading noise canceling over-ear headphones with 30-hour battery life, Auto NC Optimizer, and crystal-clear hands-free calling.',
  },
  {
    name: 'Dell UltraSharp 32-inch 4K UHD Monitor',
    category: 'Electronics',
    price: 749.0,
    stockQuantity: 0,
    description: 'IPS Black technology monitor with 4K resolution, 98% DCI-P3 color gamut, USB-C hub with 90W power delivery, and ultra-thin bezels.',
  },
  {
    name: 'Logitech Brio 4K Pro Webcam',
    category: 'Electronics',
    price: 169.99,
    stockQuantity: 22,
    description: 'Ultra HD webcam for video conferencing and streaming with HDR, RightLight 3 auto-light adjustment, and dual omnidirectional microphones.',
  },
  {
    name: 'Herman Miller Aeron Ergonomic Office Chair',
    category: 'Furniture',
    price: 1195.0,
    stockQuantity: 3,
    description: 'Iconic ergonomic desk chair featuring breathable Pellicle mesh, PostureFit SL back support, and fully adjustable armrests.',
  },
  {
    name: 'Autonomous SmartDesk Pro Motorized Desk',
    category: 'Furniture',
    price: 599.0,
    stockQuantity: 0,
    description: 'Dual-motor electric standing desk with customizable height presets, solid wood finish, and robust steel frame with 310 lbs capacity.',
  },
  {
    name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    category: 'Books',
    price: 38.5,
    stockQuantity: 30,
    description: 'Definitive software engineering guide by Robert C. Martin on best practices for writing clean, maintainable, and readable code.',
  },
  {
    name: 'Designing Data-Intensive Applications',
    category: 'Books',
    price: 47.99,
    stockQuantity: 2,
    description: 'Comprehensive guide by Martin Kleppmann on storage systems, distributed systems architecture, replication, and data processing.',
  },
  {
    name: 'Anker 100W Braided USB-C to USB-C Cable',
    category: 'Accessories',
    price: 15.99,
    stockQuantity: 75,
    description: 'Durable nylon braided high-speed charging and data cable supporting Power Delivery 3.0 up to 100W output for laptops and phones.',
  },
  {
    name: 'CalDigit TS4 Thunderbolt 4 Docking Station',
    category: 'Accessories',
    price: 399.95,
    stockQuantity: 5,
    description: '18-port flagship Thunderbolt 4 docking hub supporting dual 6K displays, 98W host charging, 2.5GbE Ethernet, and UHS-II SD card readers.',
  },
  {
    name: 'Heavyweight Fleece Pullover Hoodie',
    category: 'Clothing',
    price: 65.0,
    stockQuantity: 26,
    description: 'Premium 450 GSM heavyweight organic cotton hoodie with reinforced ribbed cuffs, kangaroo pocket, and relaxed modern fit.',
  },
];

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] MongoDB Connected.');

    console.log('[Seed] Clearing existing collections...');
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('[Seed] Cleared collections.');

    console.log('[Seed] Creating demo users (Admin and Staff)...');
    for (const u of sampleUsers) {
      await User.create(u);
    }
    console.log(`[Seed] Successfully created ${sampleUsers.length} demo users!`);

    console.log('[Seed] Inserting sample products...');
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`[Seed] Successfully inserted ${inserted.length} sample products!`);

    console.log('\n======================================================');
    console.log('              DEMO USER CREDENTIALS');
    console.log('======================================================');
    console.log('  1. ADMIN ACCOUNT');
    console.log('     Email:    admin@example.com');
    console.log('     Password: Admin@123');
    console.log('     Role:     admin (Full CRUD + Delete access)\n');
    console.log('  2. STAFF ACCOUNT');
    console.log('     Email:    staff@example.com');
    console.log('     Password: Staff@123');
    console.log('     Role:     staff (View, Search, Filter, Sort, Stock edit; DELETE is restricted)');
    console.log('======================================================\n');

    console.log('[Seed] Database seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
