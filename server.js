const express=require('express');
const {MongoClient,ObjectId}=require('mongodb');
const path=require('path');
const {randomUUID}=require('crypto');
const {BOROUGHS,filters,listing,ranking,restaurant}=require('./lib/queries');
// Node 22 can load .env without an extra dependency.
try {process.loadEnvFile();} catch(e) {if(e.code!=='ENOENT') throw e;}
function createApp(collection) {
 const app=express(); app.disable('x-powered-by');
 app.use(express.json({limit:'32kb'}));
 app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  if(['POST','PUT','DELETE'].includes(req.method)&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Cross-origin changes are not allowed.'});
  next();
 });
 app.use(express.static(path.join(__dirname,'public')));
 const route=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
 const id=value=>{if(!/^[0-9a-f]{24}$/i.test(value)){const e=new Error('Invalid restaurant ID.');e.status=400;throw e;}return new ObjectId(value);};
 app.get('/api/meta',route(async(req,res)=>{
  const cuisines=await collection.distinct('cuisine');
  res.json({boroughs:BOROUGHS,cuisines:[...new Set(cuisines.filter(x=>typeof x==='string').map(x=>x.trim()))].sort(),total:await collection.countDocuments(),mode:process.env.DEMO_MODE==='true'?'demo':'database'});
 }));
 app.get('/api/restaurants',route(async(req,res)=>{const [r]=await collection.aggregate(listing(req.query)).toArray();res.json({items:r.items,total:r.total[0]?.count||0,page:Number(req.query.page||1),pageSize:9});}));
 app.get('/api/groups',route(async(req,res)=>res.json(await collection.aggregate([{$match:filters(req.query)},{$group:{_id:'$borough',count:{$sum:1}}},{$sort:{_id:1}}]).toArray())));
 app.get('/api/rankings',route(async(req,res)=>res.json(await collection.aggregate(ranking(req.query.mode||'best')).toArray())));
 app.post('/api/restaurants',route(async(req,res)=>{const {fields,inspection}=restaurant(req.body);const r=await collection.insertOne({...fields,restaurant_id:randomUUID(),grades:inspection?[inspection]:[],createdAt:new Date()});res.status(201).json({id:r.insertedId});}));
 app.put('/api/restaurants/:id',route(async(req,res)=>{
  const {fields,inspection}=restaurant(req.body);const current=await collection.findOne({_id:id(req.params.id)});if(!current)return res.status(404).json({error:'Restaurant no longer exists.'});
  // Preserve coordinates and all existing inspection history. A new inspection is appended.
  const update={$set:{...fields,address:{...current.address,...fields.address},updatedAt:new Date()}};
  if(inspection)update.$push={grades:inspection};
  await collection.updateOne({_id:current._id},update);res.json({updated:true});
 }));
 app.delete('/api/restaurants/:id',route(async(req,res)=>{const r=await collection.deleteOne({_id:id(req.params.id)});if(!r.deletedCount)return res.status(404).json({error:'Restaurant no longer exists.'});res.json({deleted:true});}));
 app.use('/api',(req,res)=>res.status(404).json({error:'API route not found.'}));
 app.use((error,req,res,next)=>{const status=error.status||500; if(status===500)console.error(error.message);res.status(status).json({error:status===500?'Unable to complete the database request. Please try again.':error.message});});
 return app;
}
async function start(){
 const client=new MongoClient(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:7000});
 await client.connect();
 const collection=client.db(process.env.DB_NAME||'restaurantDB').collection('restaurants');
 const server=createApp(collection).listen(Number(process.env.PORT)||3000,process.env.HOST||'127.0.0.1',()=>console.log('MunchQuest: http://localhost:'+(process.env.PORT||3000)));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await client.close();process.exit(0);}));
}
if(require.main===module)start().catch(()=>{console.error('Cannot connect to MongoDB. Start local MongoDB or check MONGODB_URI and Atlas access in .env.');process.exit(1);});
module.exports={createApp};
