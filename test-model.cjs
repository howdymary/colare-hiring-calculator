const assert=require('node:assert/strict');
const m=require('./model');
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
test('Illustrative workload is $4,000 today and $1,000 before quote',()=>{const r=m.calculate(m.preset());assert.equal(r.valid,true);assert.equal(r.today,4000);assert.equal(r.beforeFee,1000);assert.equal(r.hoursBefore,40);assert.equal(r.hoursAfter,10);assert.equal(r.difference,null);});
test('A test fee is subtracted once',()=>{const r=m.calculate({...m.preset(),colareFee:1200});assert.equal(r.withColare,2200);assert.equal(r.difference,1800);});
test('Recruiter, setup and other expenses enter the correct sides',()=>{const r=m.calculate({...m.preset(),colareFee:1200,includeRecruiter:true,recruiterBefore:30,recruiterAfter:15,recruiterRate:50,includeSetup:true,setupCost:500,includeOther:true,otherBefore:200,otherAfter:300});assert.equal(r.today,5200);assert.equal(r.withColare,3500);assert.equal(r.difference,1700);});
test('Higher proposed workload can produce a cost increase',()=>{const r=m.calculate({...m.preset(),afterMinutes:90,colareFee:1000});assert.equal(r.withColare,7000);assert.equal(r.difference,-3000);});
test('Unknown included setup prevents a complete comparison',()=>{const r=m.calculate({...m.preset(),colareFee:1200,includeSetup:true});assert.equal(r.withColare,null);assert.equal(r.difference,null);});
test('An explicit zero quote is distinct from an unknown quote',()=>{assert.equal(m.calculate({...m.preset(),colareFee:0}).difference,3000);assert.equal(m.calculate({...m.preset(),colareFee:null}).difference,null);});
test('Zero candidates retain fixed setup and fee',()=>{const r=m.calculate({...m.preset(),candidates:0,colareFee:1000,includeSetup:true,setupCost:300});assert.equal(r.today,0);assert.equal(r.withColare,1300);assert.equal(r.difference,-1300);});
test('Missing rate retains hours but withholds money',()=>{const r=m.calculate({...m.preset(),engineeringRate:null,colareFee:1000});assert.equal(r.hoursBefore,40);assert.equal(r.today,null);assert.equal(r.difference,null);});
test('Empty form does not fabricate results',()=>{const r=m.calculate(m.empty());assert.equal(r.valid,true);assert.equal(r.today,null);assert.equal(r.withColare,null);assert.equal(r.difference,null);});
test('Negative and fractional candidate inputs are invalid',()=>{assert.equal(m.calculate({...m.preset(),candidates:-1}).valid,false);assert.equal(m.calculate({...m.preset(),candidates:1.5}).valid,false);assert.equal(m.calculate({...m.preset(),colareFee:-1}).valid,false);});
test('No cost increase or reduction when all totals match',()=>{assert.equal(m.calculate({...m.preset(),afterMinutes:60,colareFee:0}).difference,0);});
test('Excluded optional data cannot change the totals',()=>{const r=m.calculate({...m.preset(),colareFee:1000,recruiterBefore:500,setupCost:10000,otherAfter:20000});assert.equal(r.withColare,2000);});
test('Very large values cannot produce a displayed infinite result',()=>{assert.equal(m.calculate({...m.preset(),candidates:1e308,beforeMinutes:1e308}).valid,false);});
console.log(count+' calculation checks passed.');
