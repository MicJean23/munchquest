// Fictional in-memory demo. Never connects to your local or Atlas database.
const {createApp}=require('./server');const {demoCollection}=require('./lib/demo-collection');
async function main(){const collection=demoCollection();await collection.insertMany(require('./lib/demo-data')());process.env.DEMO_MODE='true';createApp(collection).listen(3000,'127.0.0.1',()=>console.log('Fictional in-memory demo: http://localhost:3000 (changes reset on restart)'));}
main().catch(e=>{console.error(e.message);process.exit(1);});
