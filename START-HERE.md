> Latest update: New York branding and five boroughs are restored, with more retro styling and your supplied photos. Read UPDATE-DESIGN.md for installation steps.

# MunchQuest setup and submission guide

This development version extends your ADDBASE activity and four-page wireframe. The chosen project name is MunchQuest. WEBSERVER final-project instructions are still pending.

## Try the app first

1. Install Node.js 22 or later.
2. Extract the ZIP and open the restaurant-final folder in VS Code.
3. Open Terminal → New Terminal in that folder.
4. Run `npm install`.
5. Run `npm run demo`.
6. Open http://localhost:3000.

The yellow banner identifies fictional in-memory demo data. Changes reset when the demo restarts. This preview does not use Atlas and is not proof of your final database work. Stop it with Ctrl+C before starting another mode.

## Use your existing MongoDB database

1. Start local MongoDB and connect through Compass.
2. Confirm `restaurantDB` contains the `restaurants` collection used in your activity.
3. If absent, import your original restaurants.json once. Your ZIP did not include that dataset; this project does not replace it with fictional records.
4. Copy `.env.example` to `.env`. In PowerShell: `Copy-Item .env.example .env`.
5. Keep `MONGODB_URI=mongodb://127.0.0.1:27017` and `DB_NAME=restaurantDB`, or use your actual database name.
6. Run `npm start` and open http://localhost:3000/#restaurants.

A failed database connection stops startup with a useful message. An empty connected collection displays an empty state. The app does not automatically import or erase your data.

## Connect to Atlas for the final project

1. Open your Atlas project and cluster.
2. Create/select a database user with read/write access to the project database. This is separate from your Atlas account login.
3. Add your computer's current public IP to the project's Network Access/IP access list.
4. Open Connect → Drivers and obtain the Node.js connection string.
5. Put it in MONGODB_URI in your local `.env`. Enter your database credentials there, not in chat or screenshots. URL-encode password special characters as required by connection-string syntax.
6. Connect Compass to the same cluster. Create the project database and restaurants collection if absent, then import your original restaurant JSON once. Do not re-import existing records.
7. Set DB_NAME to the actual Atlas database name. Restart with `npm start`.
8. Add a temporary test restaurant through the app and verify it appears in Atlas. Edit it and verify the change. Delete only that test record and confirm its removal.

When configured for Atlas, the app reads and writes Atlas directly; it does not run a separate sync from local MongoDB. Other open browser tabs need a refresh to show external changes.

The build binds to your computer's loopback address for classroom demonstration. Public hosting and login are not included in the confirmed requirements. Revisit access control before public deployment, especially if WEBSERVER later requires it.

## Included features

- Home, restaurant directory, inspection rankings, About, and add/edit/delete dialogs.
- Name/cuisine search; borough, cuisine, grade, and maximum-score filters.
- Grade/score filters match the SAME inspection entry.
- One card per restaurant document, nine cards per page. Existing duplicate database documents are not automatically merged.
- Borough counts computed with `$group`, with clickable filters.
- Add/edit/delete with input validation and deletion confirmation.
- Edits preserve inspection history and address coordinates. Optional new inspection fields append an inspection.
- Pictures on every result, mobile layouts, empty/error messages, keyboard-accessible dialogs.
- Real MongoDB production routes, plus a separate fictional demo adapter.

## Photos

Without an imageUrl, cards show a bundled general restaurant photograph labeled “Illustrative photo.” These are not claimed to depict the named establishment. Edit a restaurant and enter a permitted HTTPS photo URL for a specific image. Broken URLs fall back to the bundled photo. Image file uploads are not included.

Confirm whether your professor accepts illustrative photographs or requires actual photos of each establishment.

Sources:
- https://images.unsplash.com/photo-1517248135467-4c7edcad34c4
- https://images.unsplash.com/photo-1555396273-367ea4eb4db5
- https://unsplash.com/license

## Ranking rule needs professor confirmation

The instruction screenshot appears to specify an aggregated score greater than 90; the wireframe instead describes lower inspection scores as better. Two clearly labeled reports are included:

1. Lowest average inspection score: unwind inspections, group by restaurant `_id`, average numeric scores, sort ascending, show 20 records. This is a provisional interpretation.
2. Total inspection score above 90: unwind, group and sum numeric scores, filter totals greater than 90, sort descending, show 20. This interprets “aggregated” as sum and does not label a high total better quality.

Ask: “For Best Quality Restaurants, should we use the sum, average, or maximum inspection score? The example says greater than 90, while our wireframe uses lower scores. Which formula and ordering should we follow?”

## Code walkthrough

- server.js: Express, MongoDB connection, CRUD routes, error responses.
- lib/queries.js: filters, aggregation, pagination, form validation.
- public/index.html: page sections and dialogs.
- public/style.css: responsive styles.
- public/vue.js: the Vue 3 app (state, API requests, navigation, forms). index.html holds the Vue template. Database text is shown with {{ }} interpolation, which escapes it.
- public/vendor/vue.global.prod.js: local copy of Vue 3.5.43 (the page cannot load Vue from a CDN because of the Content-Security-Policy in server.js).
- demo.js and lib/demo-*.js: fictional in-memory preview only.
- test/integration.test.js: API-flow tests with a simulated collection by default.

API routes: GET /api/meta; GET /api/restaurants; GET /api/groups; GET /api/rankings; POST /api/restaurants; PUT /api/restaurants/:id; DELETE /api/restaurants/:id.

Run `npm test` for simulated API-flow tests. Run `npm run test:mongodb` to run the same checks against a real temporary MongoDB server on a compatible computer; the first run downloads a MongoDB binary. Neither test uses your Atlas data. The development environment blocked that MongoDB binary, so live MongoDB/Atlas verification remains outstanding. See TEST-RESULTS.md.

The app expects MongoDB ObjectId `_id` values and the original restaurant schema. Grades are stored as entered, not inferred from scores. An optional inspection requires grade, score, and date together.

## Submission checklist

The supplied ADDBASE screenshot shows October 16 at 11:59 p.m., 60 points. Check Canvas for later announcements.

- [x] Project name: MunchQuest.
- [ ] Confirm ranking formula and image expectations with the professor.
- [ ] Connect your actual dataset to Atlas and verify CRUD there.
- [ ] Test real searches, combined filters, grouping, pagination, and rankings.
- [ ] Capture your own final screenshots of each page and feature.
- [ ] Prepare a document with title page, website screenshots, and complete source code.
- [ ] Complete the professor's AI Use Declaration truthfully: AI assisted code, styling, debugging, and setup documentation. Review, understand, and test the code yourselves.
- [ ] Complete peer evaluation using actual contributions.
- [ ] Print the required blueprint. Confirm its expected format and update your wireframe with images, filters, and correct score wording.
- [ ] Incorporate later WEBSERVER requirements and documentation announcements.

Suggested screenshots: Home; directory with images; name search; cuisine search; borough/group summary; combined inspection filters; ranking; add and result; edit and result; delete confirmation and result; About; Atlas evidence. Keep credentials out of all screenshots.

Do not submit node_modules or .env. Include package.json, package-lock.json, server.js, lib/, public/, and follow your professor's requested source/document format. This package does not claim to complete student signatures, peer evaluations, or proof of live Atlas use.

## References

https://www.mongodb.com/docs/drivers/node/current/reference/quick-reference/
https://www.mongodb.com/docs/atlas/driver-connection/
https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/
Your supplied ADDBASE assignment, activity documents, source ZIP, and wireframe screenshot.
