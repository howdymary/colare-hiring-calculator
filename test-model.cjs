'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('./model.js');
const records=[];
function test(name,fn){try{fn();records.push({name,pass:true});}catch(e){records.push({name,pass:false,error:e.message});}}
function near(a,b){assert.ok(a!==null && Math.abs(a-b)<1e-9,`${a} != ${b}`);}
function complete(){const s=M.preset();Object.assign(s,{reviewMinutes:10,reviewPeople:1,reviewRate:100,exceptionPercent:25,exceptionMinutes:15,exceptionPeople:2,exceptionRate:100,setupHours:3,setupRate:100,calibrationHours:2,calibrationRate:100,otherHours:1,otherRate:100,colareCost:1000,otherCost:0});s.stages.forEach(x=>x.rate=100);return s;}
test('Preset computes known gross and retained attendance, but does not invent added work or ROI',()=>{const r=M.calculate(M.preset());near(r.baseline,50+2/3);near(r.retained,24);near(r.removed,26+2/3);assert.equal(r.added,null);assert.equal(r.capacity,null);assert.equal(r.economicROI,null);assert.equal(r.valid,true);});
test('Explicit review, multi-person exceptions, setup and calibration are all deducted once',()=>{const r=M.calculate(complete());near(r.added,46/3);near(r.capacity,34/3);near(r.proposed,118/3);near(r.capacityValue,3400/3);near(r.economicValue,400/3);near(r.incrementalInvestment,7600/3);near(r.economicROI,100/19);});
test('Additive evaluation retains every stage and produces negative capacity',()=>{const s=complete();s.mode='additive';const r=M.calculate(s);near(r.removed,0);near(r.retained,50+2/3);near(r.capacity,-46/3);near(r.economicValue,-7600/3);near(r.economicROI,-100);});
test('Stage participation changes stage entrants only, not the shared cohort',()=>{const s=complete();s.stages[1].participation=50;const r=M.calculate(s);near(r.stages[1].entries,16);near(r.removed,40/3);near(r.capacity,-2);near(r.candidates,32);});
test('Multiple interviewers count person-hours, not elapsed hours',()=>{const s=complete();s.stages[1].people=3;const r=M.calculate(s);near(r.removed,80);near(r.baseline,104);});
test('Assessment reach controls review and exception volume',()=>{const s=complete();s.assessmentParticipation=50;const r=M.calculate(s);near(r.assessed,16);near(r.added,32/3);});
test('Known zero exceptions makes unused exception minutes/count/rate irrelevant',()=>{const s=complete();s.exceptionPercent=0;s.exceptionMinutes=null;s.exceptionPeople=null;s.exceptionRate=null;const r=M.calculate(s);near(r.additions[1].hours,0);assert.equal(r.timeReady,true);assert.ok(r.economicROI!==null);});
test('Blank added work stays unknown instead of becoming zero',()=>{const s=complete();s.setupHours='';const r=M.calculate(s);assert.equal(r.added,null);assert.equal(r.capacity,null);assert.equal(r.economicROI,null);});
test('Missing price prevents value-after-costs and ROI, but not time/capacity value',()=>{const s=complete();s.colareCost=null;const r=M.calculate(s);near(r.capacity,34/3);near(r.capacityValue,3400/3);assert.equal(r.economicValue,null);assert.equal(r.economicROI,null);});
test('Missing other incremental cash cost is not treated as zero',()=>{const s=complete();s.otherCost=null;assert.equal(M.calculate(s).economicROI,null);});
test('A removed-stage rate is required; an unchanged-stage rate is not required for difference value',()=>{const s=complete();s.stages[0].rate=null;assert.ok(M.calculate(s).economicROI!==null);s.stages[1].rate=null;assert.equal(M.calculate(s).capacityValue,null);assert.equal(M.calculate(s).economicROI,null);});
test('Unknown period prevents a final economic result',()=>{const s=complete();s.period=null;const r=M.calculate(s);assert.equal(r.timeReady,false);assert.equal(r.capacity,null);assert.equal(r.economicROI,null);});
test('Zero incremental investment makes ROI undefined rather than infinite',()=>{const s=complete();Object.assign(s,{reviewMinutes:0,exceptionPercent:0,setupHours:0,calibrationHours:0,otherHours:0,colareCost:0,otherCost:0});const r=M.calculate(s);near(r.incrementalInvestment,0);assert.equal(r.economicROI,null);near(r.economicValue,8000/3);});
test('Low removed-stage rate and high added-labor rates can reverse financial value independently of hours',()=>{const s=complete();s.stages[1].rate=10;const r=M.calculate(s);assert.ok(r.capacity>0);assert.ok(r.capacityValue<0);assert.ok(r.economicROI<0);});
test('Negative, >100% and fractional-attendee inputs are invalid',()=>{for(const edit of [s=>s.setupHours=-1,s=>s.stages[0].participation=101,s=>s.reviewPeople=1.5,s=>s.period=0]){const s=complete();edit(s);assert.equal(M.calculate(s).valid,false);}});
test('Zero cohort does not erase fixed setup/calibration effort',()=>{const s=complete();s.candidates=0;const r=M.calculate(s);near(r.baseline,0);near(r.added,6);near(r.capacity,-6);});
test('Changing the period label does not silently annualize counts or costs',()=>{const s=complete();const a=M.calculate(s);s.periodUnit='months';s.period=12;const b=M.calculate(s);near(a.baseline,b.baseline);near(a.economicValue,b.economicValue);});
test('Whitespace remains unknown',()=>{const s=complete();s.otherHours=' ';assert.equal(M.calculate(s).capacity,null);});
fs.writeFileSync(__dirname+'/Model_Test_Results.json',JSON.stringify({testedAt:new Date().toISOString(),passed:records.filter(x=>x.pass).length,total:records.length,tests:records},null,2));
console.log(JSON.stringify(records,null,2));
if(records.some(x=>!x.pass))process.exitCode=1;
