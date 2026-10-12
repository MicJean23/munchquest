const {test}=require('node:test');const assert=require('node:assert/strict');const {MongoClient,ObjectId}=require('mongodb');const {createApp}=require('../server');
test('API flows using demo adapter (not live MongoDB): filters, unique records, pagination, grouping, rankings, CRUD and validation',async()=>{
 let mongo,client,col;if(process.env.LIVE_MONGO_TEST==='true'){const {MongoMemoryServer}=require('mongodb-memory-server');mongo=await MongoMemoryServer.create();client=new MongoClient(mongo.getUri());await client.connect();col=client.db('test').collection('restaurants');}else{col=require('../lib/demo-collection').demoCollection();}await col.insertMany(require('../lib/demo-data')());const server=createApp(col).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 async function request(url,method='GET',body){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return{status:r.status,data:await r.json()};}
 try{
 let r=await request('/api/restaurants');assert.equal(r.data.total,23);assert.equal(r.data.items.length,9);assert.equal(new Set(r.data.items.map(x=>x._id)).size,9);
 const first=r.data.items.map(x=>x._id);r=await request('/api/restaurants?page=2');assert.ok(r.data.items.every(x=>!first.includes(x._id)));
 r=await request('/api/restaurants?cuisine=American&grade=A&maxScore=0');assert.ok(r.data.items.every(x=>x.grades.some(g=>g.grade==='A'&&g.score===0)));assert.equal(r.data.total,0);
 r=await request('/api/restaurants?grade=A&maxScore=0');assert.equal(r.data.total,2);
 r=await request('/api/restaurants?search=Garden');assert.equal(r.data.total,5);
 r=await request('/api/restaurants?search=%5B');assert.equal(r.status,200);assert.equal(r.data.total,0);
 r=await request('/api/restaurants?grade=B&maxScore=0');assert.equal(r.data.total,0);
 r=await request('/api/restaurants?cuisine=American');assert.equal(r.data.total,5);
 r=await request('/api/groups');assert.equal(r.data.reduce((s,x)=>s+x.count,0),23);
 r=await request('/api/rankings');assert.equal(r.data.length,20);assert.ok(r.data.every((x,i,a)=>!i||x.averageScore>=a[i-1].averageScore));
 r=await request('/api/rankings?mode=total90');assert.ok(r.data.every(x=>x.totalScore>90));
 r=await request('/api/restaurants?maxScore=abc');assert.equal(r.status,400);
 r=await request('/api/restaurants?borough=NoSuchLocation');assert.equal(r.status,400);
 const doc={name:'Integration Test',cuisine:'Pizza',borough:'Brooklyn',building:'2',street:'Test St',zipcode:'10001',imageUrl:'',grade:'A',score:'0',inspectionDate:'2025-01-01'};
 r=await request('/api/restaurants','POST',doc);assert.equal(r.status,201);const id=r.data.id;
 await col.updateOne({_id:new ObjectId(id)},{$set:{'address.coord':[-73,40]}});
 r=await request('/api/restaurants/'+id,'PUT',{...doc,name:'Updated Test',grade:'',score:'',inspectionDate:''});assert.equal(r.status,200);let saved=await col.findOne({name:'Updated Test'});assert.equal(saved.grades.length,1);assert.deepEqual(saved.address.coord,[-73,40]);
 await request('/api/restaurants/'+id,'PUT',{...doc,grade:'B',score:19});saved=await col.findOne({_id:saved._id});assert.equal(saved.grades.length,2);
 r=await request('/api/restaurants','POST',{...doc,imageUrl:'javascript:alert(1)'});assert.equal(r.status,400);
 r=await request('/api/restaurants','POST',{...doc,name:''});assert.equal(r.status,400);
 r=await request('/api/restaurants/'+id,'DELETE');assert.equal(r.status,200);r=await request('/api/restaurants/'+id,'DELETE');assert.equal(r.status,404);
 r=await request('/api/restaurants/invalid','DELETE');assert.equal(r.status,400);
 }finally{await new Promise(r=>server.close(r));if(client)await client.close();if(mongo)await mongo.stop();}
});
