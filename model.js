/* Colare hiring workload planning model. No customer outcome is encoded here. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({
    version: 1, scenario: 'Your hiring process', basis: 'user-entered',
    candidates: null, period: null, periodUnit: 'weeks', mode: 'replace',
    stages: [{name: 'Current screening stage', participation: null, minutes: null, people: null, rate: null, replace: false}],
    assessmentParticipation: null,
    reviewMinutes: null, reviewPeople: null, reviewRate: null,
    exceptionPercent: null, exceptionMinutes: null, exceptionPeople: null, exceptionRate: null,
    setupHours: null, setupRate: null, calibrationHours: null, calibrationRate: null,
    otherHours: null, otherRate: null, colareCost: null, otherCost: null
  });
  const preset = () => ({...empty(),
    scenario: 'Illustrative presentation replacement', basis: 'illustrative-preset',
    candidates: 32, period: 4,
    stages: [
      {name: 'Phone screen', participation: 100, minutes: 45, people: 1, rate: null, replace: false},
      {name: 'Presentation + Q&A', participation: 100, minutes: 50, people: 1, rate: null, replace: true}
    ],
    assessmentParticipation: 100
  });
  function calculate(s) {
    const errors = [], missing = new Set();
    function num(value, label, max = Infinity, integer = false, positive = false) {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n)) || (positive && n === 0)) {
        errors.push(label + ' is outside its valid range.'); return null;
      }
      return n;
    }
    const required = (value, label) => { if (value === null) missing.add(label); return value; };
    const mul = (...xs) => xs.some(x => x === 0) ? 0 : xs.some(x => x === null) ? null : xs.reduce((a,b) => a*b, 1);
    const sum = xs => xs.some(x => x === null) ? null : xs.reduce((a,b) => a+b, 0);
    const sub = (a,b) => a === null || b === null ? null : a-b;
    const n = required(num(s.candidates,'Candidate count',Infinity,true), 'Candidate count');
    const period = required(num(s.period,'Period',Infinity,false,true), 'Period');
    if (!['replace','additive'].includes(s.mode)) errors.push('Choose replacement or additive evaluation.');
    const stages = (s.stages || []).map((v,i) => {
      const label = String(v.name || 'Stage ' + (i+1));
      const p = num(v.participation,label+' participation',100);
      const m = num(v.minutes,label+' minutes');
      const people = num(v.people,label+' attendees',Infinity,true);
      const rate = num(v.rate,label+' rate');
      const entries = mul(n,p === null ? null : p/100);
      const hours = mul(entries,m === null ? null : m/60,people);
      if (hours === null) {
        if (p === null) missing.add(label+': participation');
        if (m === null) missing.add(label+': minutes');
        if (people === null) missing.add(label+': attendees');
      }
      const isRemoved = s.mode === 'replace' && v.replace === true;
      const removed = isRemoved ? hours : 0;
      const retained = isRemoved ? 0 : hours;
      return {name:label, entries, hours, removed, retained, rate, removedValue:mul(removed,rate), isRemoved};
    });
    if (!stages.length) errors.push('Add at least one current stage.');
    const assessmentP = num(s.assessmentParticipation,'Assessment participation',100);
    const assessed = mul(n,assessmentP === null ? null : assessmentP/100);
    if (assessed === null) missing.add('Assessment participation');
    const rm = num(s.reviewMinutes,'Report review minutes');
    const rp = num(s.reviewPeople,'Report reviewers',Infinity,true);
    const rr = num(s.reviewRate,'Report review rate');
    const reviewHours = mul(assessed,rm === null ? null : rm/60,rp);
    if (reviewHours === null) { if (rm===null) missing.add('Report review minutes'); if(rp===null) missing.add('Report reviewers'); }
    const ep = num(s.exceptionPercent,'Exception participation',100);
    const em = num(s.exceptionMinutes,'Exception minutes');
    const en = num(s.exceptionPeople,'Exception participants',Infinity,true);
    const er = num(s.exceptionRate,'Exception rate');
    const exceptionEntries = mul(assessed,ep === null ? null : ep/100);
    const exceptionHours = mul(exceptionEntries,em === null ? null : em/60,en);
    if (exceptionHours === null) { if(ep===null) missing.add('Exception participation'); if(em===null) missing.add('Exception minutes'); if(en===null) missing.add('Exception participants'); }
    const fixed = [
      ['Setup', 'setupHours','setupRate'],
      ['Calibration','calibrationHours','calibrationRate'],
      ['Other added work','otherHours','otherRate']
    ].map(([label,h,r]) => ({name:label,hours:required(num(s[h],label+' hours'),label+' hours'),rate:num(s[r],label+' rate')}));
    const additions = [
      {name:'Report review',hours:reviewHours,rate:rr},
      {name:'Exceptions',hours:exceptionHours,rate:er},...fixed
    ];
    additions.forEach(v => {v.value=mul(v.hours,v.rate);});
    const baseline = sum(stages.map(x=>x.hours));
    const retained = sum(stages.map(x=>x.retained));
    const removed = sum(stages.map(x=>x.removed));
    const added = sum(additions.map(x=>x.hours));
    const proposed = sum([retained,added]);
    const timeReady = [baseline,retained,removed,added,n,period].every(x=>x!==null) && missing.size === 0;
    const capacity = timeReady ? sub(removed,added) : null;
    const grossRemovedValue = sum(stages.map(x=>x.removedValue));
    const addedLaborValue = sum(additions.map(x=>x.value));
    const capacityValue = timeReady ? sub(grossRemovedValue,addedLaborValue) : null;
    const colareCost = num(s.colareCost,'Colare cost');
    const otherCost = num(s.otherCost,'Other incremental cash costs');
    const incrementalInvestment = sum([addedLaborValue,colareCost,otherCost]);
    const economicValue = timeReady ? sub(grossRemovedValue,incrementalInvestment) : null;
    const economicROI = economicValue !== null && incrementalInvestment !== null && incrementalInvestment > 0 ? economicValue / incrementalInvestment *100 : null;
    const costMissing = [];
    stages.forEach(v=>{if(v.removed !== 0 && v.rate===null) costMissing.push(v.name+': loaded hourly rate');});
    additions.forEach(v=>{if(v.hours !== 0 && v.rate===null) costMissing.push(v.name+': loaded hourly rate');});
    if(colareCost===null) costMissing.push('Colare cost for this period');
    if(otherCost===null) costMissing.push('Other incremental cash costs');
    return {valid:errors.length===0,timeReady,errors,missing:[...missing],costMissing,period,candidates:n,stages,assessed,additions,baseline,retained,removed,added,proposed,capacity,grossRemovedValue,addedLaborValue,capacityValue,colareCost,otherCost,incrementalInvestment,economicValue,economicROI};
  }
  const api = {empty,preset,calculate,clone};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.ColareModel=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
