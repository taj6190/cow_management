import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://syedtaj1234_db_user:4FlzRgkVn70rI3VX@ac-6cwmtll-shard-00-00.bjvkf0n.mongodb.net:27017,ac-6cwmtll-shard-00-01.bjvkf0n.mongodb.net:27017,ac-6cwmtll-shard-00-02.bjvkf0n.mongodb.net:27017/cow_farm?tls=true&replicaSet=atlas-9wd5hb-shard-0&authSource=admin&retryWrites=true&w=majority';

async function clearDatabase() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const collections = await mongoose.connection.db.collections();
  
  for (const collection of collections) {
    const collectionName = collection.collectionName;
    if (collectionName === 'users') {
      console.log('Clearing all users except admin...');
      await collection.deleteMany({ email: { $ne: 'admin@gorufarm.com' } });
    } else {
      console.log(`Clearing collection: ${collectionName}...`);
      await collection.deleteMany({});
    }
  }

  console.log('Database cleared successfully. Admin user preserved.');
  await mongoose.disconnect();
}

clearDatabase().catch((err) => {
  console.error('Error clearing database:', err);
  process.exit(1);
});
