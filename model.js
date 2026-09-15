(function(root){
  'use strict';
  const preset=()=>({candidates:40,beforeMinutes:60,afterMinutes:15,engineeringRate:100,colareFee:null,includeRecruiter:false,recruiterBefore:null,recruiterAfter:null,recruiterRate:null,includeSetup:false,setupCost:null,includeOther:false,otherBefore:null,otherAfter:null});
  const empty=()=>Object.fromEntries(Object.entries(preset()).map(([k,v])=>[k,typeof v==='boolean'?false:null]));
  function calculate(s){
    const errors=[];
    const read=(key,label,integer=false)=>{const value=s[key];if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(value);if(!Number.isFinite(n)||n<0||(integer&&!Number.isInteger(n))){errors.push('Enter a valid '+label+'.');return null;}return n;};
    const product=(...xs)=>xs.some(x=>x===0)?0:xs.includes(null)?null:xs.reduce((a,b)=>a*b,1);
    const sum=(...xs)=>xs.includes(null)?null:xs.reduce((a,b)=>a+b,0);
    const candidates=read('candidates','whole candidate count',true);
    const beforeMinutes=read('beforeMinutes','current engineering time');
    const afterMinutes=read('afterMinutes','remaining engineering time');
    const rate=read('engineeringRate','engineering hourly cost');
    const fee=read('colareFee','Colare quote');
    const hoursBefore=product(candidates,beforeMinutes,1/60),hoursAfter=product(candidates,afterMinutes,1/60);
    const engineeringBefore=product(hoursBefore,rate),engineeringAfter=product(hoursAfter,rate);
    let recruiterBefore=0,recruiterAfter=0,setup=0,otherBefore=0,otherAfter=0;
    if(s.includeRecruiter){const a=read('recruiterBefore','current recruiter time'),b=read('recruiterAfter','remaining recruiter time'),r=read('recruiterRate','recruiter hourly cost');recruiterBefore=product(candidates,a,1/60,r);recruiterAfter=product(candidates,b,1/60,r);}
    if(s.includeSetup)setup=read('setupCost','setup cost');
    if(s.includeOther){otherBefore=read('otherBefore','current other expenses');otherAfter=read('otherAfter','proposed other expenses');}
    const today=sum(engineeringBefore,recruiterBefore,otherBefore);
    const beforeFee=sum(engineeringAfter,recruiterAfter,setup,otherAfter);
    const withColare=sum(beforeFee,fee);
    const difference=today===null||withColare===null?null:today-withColare;
    const numeric=[today,beforeFee,withColare,difference,hoursBefore,hoursAfter,engineeringBefore,engineeringAfter,recruiterBefore,recruiterAfter];
    if(numeric.some(x=>x!==null&&!Number.isFinite(x)))errors.push('These values are too large to calculate.');
    return {valid:errors.length===0,errors,today,beforeFee,withColare,difference,fee,hoursBefore,hoursAfter,engineeringBefore,engineeringAfter,recruiterBefore,recruiterAfter,setup,otherBefore,otherAfter};
  }
  const api={preset,empty,calculate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CostModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
