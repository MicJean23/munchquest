// Demo/test adapter only. Production server.js always uses the real MongoDB driver.
require('mingo/init/system');
const {aggregate,Query}=require('mingo');const {ObjectId}=require('mongodb');
function demoCollection(initial=[]){let docs=initial;
 const copy=x=>structuredClone(x),matches=(d,q)=>new Query(q).test(d);
 return {
 aggregate:p=>({toArray:async()=>aggregate(docs,p)}),
 distinct:async k=>[...new Set(docs.map(d=>d[k]))],
 countDocuments:async()=>docs.length,
 insertMany:async values=>{docs.push(...values.map(d=>({...d,_id:d._id?.toString()||new ObjectId().toString()})));},
 insertOne:async d=>{const id=new ObjectId().toString();docs.push({...d,_id:id});return{insertedId:id};},
 findOne:async q=>copy(docs.find(d=>matches(d,{...q,...(q._id?{_id:q._id.toString()}: {})}))||null),
 updateOne:async(q,u)=>{const d=docs.find(d=>d._id===q._id.toString());if(!d)return{matchedCount:0};for(const[k,v]of Object.entries(u.$set||{})){if(k==='address.coord')d.address.coord=v;else d[k]=v;}for(const[k,v]of Object.entries(u.$push||{}))(d[k]??=[]).push(v);return{matchedCount:1};},
 deleteOne:async q=>{const index=docs.findIndex(d=>d._id===q._id.toString());if(index<0)return{deletedCount:0};docs.splice(index,1);return{deletedCount:1};}
 };
}
module.exports={demoCollection};
