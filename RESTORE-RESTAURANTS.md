# Restore restaurant listings

The Vue code and design have not been changed. This ZIP already includes 23 fictional sample restaurants in lib/demo-data.js. It does not contain a backup/export of your real MongoDB records.

## Show the existing demo restaurants
Open a terminal inside restaurant-final. Run npm.cmd install, then npm.cmd run demo. Open http://localhost:3000. Do not open index.html directly or through VS Code Live Server: those do not run the restaurant API. Demo changes reset on restart.

## Store the supplied sample restaurants in MongoDB
1. Stop any running app with Ctrl+C.
2. Start local MongoDB, or configure your MongoDB connection using .env.example as a guide. Use the intended DB_NAME (default restaurantDB) and collection restaurants.
3. Run npm.cmd restore:restaurants.
4. Run npm.cmd start and open http://localhost:3000.

This inserts only missing DEMO-0 through DEMO-22 records. It does not delete records or overwrite existing sample edits. Running it again does not duplicate those records. These are fictional practice records, not recovered real establishments or inspection data.

If your original restaurants are in another database/Atlas cluster, use its connection and database name instead of importing samples. Recovering deleted original records requires their JSON/BSON export or backup.

Validation: the existing demo API returns 23 records. API regression tests and restoration idempotency checks passed. Live MongoDB was not accessible for verification. A browser check was attempted but Chromium could not start in this environment.
