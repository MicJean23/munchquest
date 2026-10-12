// Restore only the fictional sample records already supplied with this project.
const { MongoClient } = require('mongodb');
const makeSamples = require('./lib/demo-data');
try { process.loadEnvFile(); } catch (e) { if (e.code !== 'ENOENT') throw e; }

async function restore(collection) {
  let inserted = 0;
  for (const record of makeSamples()) {
    // Stable restaurant_id avoids duplicates and preserves edited existing records.
    const result = await collection.updateOne(
      { restaurant_id: record.restaurant_id },
      { $setOnInsert: record },
      { upsert: true }
    );
    inserted += result.upsertedCount || 0;
  }
  return inserted;
}
async function main() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 7000 });
  try {
    await client.connect();
    const collection = client.db(process.env.DB_NAME || 'restaurantDB').collection('restaurants');
    const inserted = await restore(collection);
    console.log(`Added ${inserted} fictional sample restaurants. Existing records were preserved.`);
    console.log('Start the MongoDB-backed website with npm.cmd start, then open http://localhost:3000.');
  } finally { await client.close(); }
}
if (require.main === module) main().catch(() => {
  console.error('Could not restore restaurants. Check MongoDB is running and MONGODB_URI / DB_NAME are correct. Existing data was not deleted; rerunning is safe.');
  process.exitCode = 1;
});
module.exports = { restore };
