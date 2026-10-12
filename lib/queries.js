const BOROUGHS = ['Bronx','Brooklyn','Manhattan','Queens','Staten Island'];
function fail(message) { const e = new Error(message); e.status = 400; throw e; }
function str(value, max=120) { if (typeof value !== 'string') fail('Expected a text value.'); return value.trim().slice(0,max); }
function number(value, name, max=1000) { const n=Number(value); if (!Number.isFinite(n)||n<0||n>max) fail(`${name} must be between 0 and ${max}.`); return n; }
function filters(q) {
 const match={};
 if(q.search) {const s=str(q.search).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');match.$or=[{name:{$regex:s,$options:'i'}},{cuisine:{$regex:s,$options:'i'}}];}
 if(q.borough) {if(!BOROUGHS.includes(q.borough))fail('Invalid borough.');match.borough=q.borough;}
 if(q.cuisine) match.cuisine={$regex:'^'+str(q.cuisine).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*$',$options:'i'};
 // Match both conditions against the same inspection, without duplicating restaurants.
 const inspection={};
 if(q.grade) {if(!['A','B','C','Z','P','N'].includes(q.grade)) fail('Invalid grade.');inspection.grade=q.grade;}
 if(q.maxScore!==undefined && q.maxScore!=='') inspection.score={$lte:number(q.maxScore,'Maximum score')};
 if(Object.keys(inspection).length) match.grades={$elemMatch:inspection};
 return match;
}
function listing(q) {
 const page=q.page===undefined?1:number(q.page,'Page',100000); if(page<1||!Number.isInteger(page))fail('Invalid page.');
 return [{$match:filters(q)},{$facet:{items:[{$sort:{name:1,_id:1}},{$skip:(page-1)*9},{$limit:9}],total:[{$count:'count'}]}}];
}
function ranking(mode) {
 if(!['best','total90'].includes(mode))fail('Invalid report.');
 return [{$unwind:'$grades'},{$match:{'grades.score':{$type:'number',$gte:0}}},{$group:{_id:'$_id',name:{$first:'$name'},borough:{$first:'$borough'},cuisine:{$first:'$cuisine'},averageScore:{$avg:'$grades.score'},totalScore:{$sum:'$grades.score'},inspectionCount:{$sum:1}}},...(mode==='total90'?[{$match:{totalScore:{$gt:90}}},{$sort:{totalScore:-1,name:1,_id:1}}]:[{$sort:{averageScore:1,name:1,_id:1}}]),{$limit:20}];
}
function restaurant(body) {
 if(!body||typeof body!=='object'||Array.isArray(body))fail('Invalid restaurant data.');
 const name=str(body.name||'',120),cuisine=str(body.cuisine||'',80);
 if(!name||!cuisine)fail('Restaurant name and cuisine are required.');
 if(!BOROUGHS.includes(body.borough))fail('Choose a borough.');
 let imageUrl=str(body.imageUrl||'',1000);
 if(imageUrl) {try{const u=new URL(imageUrl);if(u.protocol!=='https:'||u.username||u.password)fail('Use an HTTPS image URL.');}catch{fail('Use a valid HTTPS image URL.');}}
 const address={building:str(body.building||'',30),street:str(body.street||'',120),zipcode:str(body.zipcode||'',15)};
 let inspection=null;
 if(body.grade||body.inspectionDate||body.score!==''&&body.score!==undefined) {
  if(!['A','B','C','Z','P','N'].includes(body.grade)||body.score===''||body.score===undefined)fail('Provide both inspection grade and score, or leave both blank.');
  const date=new Date(body.inspectionDate);if(!body.inspectionDate||!Number.isFinite(date.getTime())||date>new Date())fail('Choose a valid inspection date that is not in the future.');
  inspection={grade:body.grade,score:number(body.score,'Inspection score'),date};
 }
 return {fields:{name,cuisine,borough:body.borough,address,imageUrl},inspection};
}
module.exports={BOROUGHS,filters,listing,ranking,restaurant};
