(function () {
  'use strict';
  const root=document.getElementById('colare-calculator');
  const $=id=>root.querySelector('#'+id);
  const model=window.ColareModel;
  let state=model.preset();
  const fmt=n=>n===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
  const money=n=>n===null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const value=input=>input.type==='number'?(input.value===''?null:Number(input.value)):input.value;
  const text=(id,t)=>{$(id).textContent=t;};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function bindFields(){
    root.querySelectorAll('[data-field]').forEach(el=>{el.value=state[el.dataset.field]??'';});
  }
  function renderStages(){
    $('stages').innerHTML=state.stages.map((s,i)=>`<div class="stage" data-stage="${i}"><div class="stage-header"><label>Stage ${i+1}<input data-stage-field="name" aria-label="Stage ${i+1} name" maxlength="80" value="${escape(s.name)}"></label><button type="button" data-remove="${i}" ${state.stages.length===1?'disabled':''}>Remove</button></div><div class="stage-fields">${[['participation','Cohort reaching stage (%)','100','any'],['minutes','Minutes per candidate','','any'],['people','Interviewers per candidate','','1'],['rate','Loaded rate per person-hour ($)','','any']].map(([k,l,max,step])=>`<label>${l}<input type="number" data-stage-field="${k}" aria-label="${escape(s.name)} ${l}" min="0" ${max?'max="'+max+'"':''} step="${step}" placeholder="${k==='rate'?'Optional for hours':'Unknown'}" value="${s[k]??''}"></label>`).join('')}</div><div class="stage-outcome"><label><input type="checkbox" data-stage-field="replace" ${s.replace?'checked':''} ${state.mode==='additive'?'disabled':''}>Propose replacing this stage</label><output id="stage-hours-${i}"></output></div></div>`).join('');
  }
  function output(){
    const r=model.calculate(state);
    text('basis-note',state.basis==='illustrative-preset'?'Illustrative model: 32 candidates, 45-minute screen and 50-minute presentation. Not measured customer savings. Unknown costs and added work stay blank.':'Your modeled inputs. Not a measured outcome, a Colare capacity promise or a quote. Blank values remain unknown.');
    text('period-label',`Modeled comparison · ${state.period??'—'} ${state.periodUnit} · ${state.candidates??'—'} candidates`);
    $('validation').hidden=r.valid;text('validation',r.errors.join(' '));
    const valid=r.valid;
    text('capacity',valid&&r.capacity!==null?fmt(r.capacity)+' h':'—');
    $('capacity').classList.toggle('negative',valid&&r.capacity!==null&&r.capacity<0);
    text('capacity-note',!valid?'Correct the input values below.':r.capacity===null?'Complete the added-work inputs to calculate.':r.capacity<0?'The proposal adds customer work at this volume.':r.capacity===0?'The modeled workload is unchanged.':'Modeled staff capacity for other work; not a cash saving.');
    text('baseline',valid&&r.baseline!==null?fmt(r.baseline)+' h':'—');
    text('proposed',!valid?'—':r.proposed!==null?fmt(r.proposed)+' h':r.retained!==null?fmt(r.retained)+' h + unknown':'—');
    text('removed',valid&&r.removed!==null?fmt(r.removed)+' h':'—');
    text('added',valid&&r.added!==null?fmt(r.added)+' h':'Unknown');
    text('missing',!valid?'':r.missing.length?'Needed for a complete time comparison: '+r.missing.join('; ')+'.':'All modeled time inputs are present. Confirm stage participation, role scope and equivalent evaluation standards.');
    $('missing-detail').hidden=!valid||r.missing.length===0;
    text('missing-summary',r.missing.length+' time inputs still needed');
    text('capacity-value',valid?money(r.capacityValue):'—');
    text('economic-value',valid?money(r.economicValue):'—');
    text('roi',valid&&r.economicROI!==null?fmt(r.economicROI)+'%':'—');
    ['capacity-value','economic-value','roi'].forEach((id,i)=>{$(id).classList.toggle('negative',valid&&[r.capacityValue,r.economicValue,r.economicROI][i]!==null&&[r.capacityValue,r.economicValue,r.economicROI][i]<0);});
    text('cost-missing',!valid?'':r.capacity===null?'Complete time inputs first. Rates and the commercial costs are also needed for the full economic comparison.':r.costMissing.length?'Economic inputs still needed: '+r.costMissing.join('; ')+'.':r.incrementalInvestment===0?'Economic ROI is undefined because incremental investment is zero.':'Economic ROI values opportunity cost, not a cash return. Added labor value is included in its investment denominator.');
    r.stages.forEach((s,i)=>{const el=$('stage-hours-'+i);if(el)el.textContent=s.hours===null?'Stage hours unknown':fmt(s.hours)+' h · '+(s.isRemoved?'proposed removal':'retained');});
    const max=Math.max(r.baseline??0,r.proposed??r.retained??0,1);
    const seg=(v,cls)=>v!==null&&v>0?`<span class="bar ${cls}" style="width:${v/max*100}%"></span>`:'';
    $('chart').innerHTML=valid?`<div class="chart-row"><label>Current process · hours</label><div class="bar-track">${seg(r.retained,'kept')}${seg(r.removed,'removed')}</div></div><div class="chart-row"><label>Proposed process · hours</label><div class="bar-track">${seg(r.retained,'kept')}${seg(r.added,'added')}</div>${r.added===null?'<p class="unknown-addition">Added work unknown; no size is assigned to it.</p>':''}</div>`:'';
    $('chart').setAttribute('aria-label',`Current ${fmt(r.baseline)} hours. Proposed ${r.proposed===null?fmt(r.retained)+' retained hours plus unknown added work':fmt(r.proposed)+' hours'}. Selected replacement ${fmt(r.removed)} hours.`);
  }
  function load(s){state=s;bindFields();renderStages();output();}
  $('inputs').addEventListener('input',event=>{
    const el=event.target;
    if(state.basis==='illustrative-preset')state.basis='user-edited-preset';
    if(el.dataset.field){state[el.dataset.field]=value(el);if(el.dataset.field==='mode')renderStages();}
    if(el.dataset.stageField){const i=Number(el.closest('[data-stage]').dataset.stage);state.stages[i][el.dataset.stageField]=el.type==='checkbox'?el.checked:value(el);}
    output();
  });
  $('inputs').addEventListener('submit',e=>e.preventDefault());
  $('stages').addEventListener('click',e=>{if(e.target.dataset.remove!==undefined){state.stages.splice(Number(e.target.dataset.remove),1);renderStages();output();}});
  $('add-stage').addEventListener('click',()=>{state.stages.push({name:'Additional stage',participation:null,minutes:null,people:null,rate:null,replace:false});renderStages();output();});
  $('preset').addEventListener('click',()=>load(model.preset()));
  $('reset').addEventListener('click',()=>load(model.empty()));
  $('export').addEventListener('click',()=>{
    const result=model.calculate(state);
    const payload={title:'Colare modeled hiring workload',exportedAt:new Date().toISOString(),inputs:state,result,scope:'Modeled only; not measured savings or a quote. Blank inputs are null. Capacity value is not cash savings.'};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Colare_Calculator_Inputs.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);text('export-status','Inputs exported with calculation and assumptions.');
  });
  load(state);
  $('economics-detail').open=window.innerWidth>900;
})();
