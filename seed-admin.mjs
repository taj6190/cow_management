// Seed admin user script
// Usage: node seed-admin.mjs [email] [password] [name]

import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://syedtaj1234_db_user:4FlzRgkVn70rI3VX@ac-6cwmtll-shard-00-00.bjvkf0n.mongodb.net:27017,ac-6cwmtll-shard-00-01.bjvkf0n.mongodb.net:27017,ac-6cwmtll-shard-00-02.bjvkf0n.mongodb.net:27017/cow_farm?tls=true&replicaSet=atlas-9wd5hb-shard-0&authSource=admin&retryWrites=true&w=majority';

const email = process.argv[2] || 'admin@gorufarm.com';
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Admin';

async function seedAdmin() {
  const { default: mongoose } = await import('mongoose');
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, default: 'admin' },
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // Check if user already exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`\n⚠️  User "${email}" already exists.`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   Role: ${existing.role}`);
    console.log(`   To update password, delete user first.`);
    await mongoose.disconnect();
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  });

  console.log('\n✅ Admin user created successfully!');
  console.log('┌──────────────────────────────────────');
  console.log(`│  Name:     ${user.name}`);
  console.log(`│  Email:    ${user.email}`);
  console.log(`│  Password: ${password}`);
  console.log(`│  Role:     ${user.role}`);
  console.log('└──────────────────────────────────────');
  console.log('\n🔐 Use these credentials to log in at /login');

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin:', err);
  process.exit(1);
});
