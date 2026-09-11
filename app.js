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
    $('stages').innerHTML=state.stages.map((s,i)=>`<div class="stage" data-stage="${i}"><div class="stage-header"><label>Stage ${i+1}<input data-stage-field="name" aria-label="Stage ${i+1} name" maxlength="80" value="${escape(s.name)}"></label><button type="button" data-remove="${i}" ${state.stages.length===1?'disabled':''}>Remove</button></div><div class="stage-fields">${[['participation','Cohort reaching stage (%)','100','any'],['minutes','Minutes per candidate','','any'],['people','Interviewers per candidate','','1'],['rate','Hourly cost per person ($)','','any']].map(([k,l,max,step])=>`<label>${l}<input type="number" data-stage-field="${k}" aria-label="${escape(s.name)} ${l}" min="0" ${max?'max="'+max+'"':''} step="${step}" placeholder="${k==='rate'?'Optional for hours':'Unknown'}" value="${s[k]??''}"></label>`).join('')}</div><div class="stage-outcome"><label><input type="checkbox" data-stage-field="replace" ${s.replace?'checked':''} ${state.mode==='additive'?'disabled':''}>Propose replacing this stage</label><output id="stage-hours-${i}"></output></div></div>`).join('');
  }
  function output(){
    const r=model.calculate(state);
    $('example-note').hidden=state.basis!=='illustrative-preset';
    text('period-label',`Estimate · ${state.period??'—'} ${state.periodUnit} · ${state.candidates??'—'} candidates`);
    $('validation').hidden=r.valid;text('validation',r.errors.join(' '));
    const valid=r.valid;
    text('capacity',valid&&r.capacity!==null?fmt(r.capacity)+' h':'—');
    $('capacity').classList.toggle('negative',valid&&r.capacity!==null&&r.capacity<0);
    text('capacity-note',!valid?'Check the input values.':r.capacity===null?'Complete the missing inputs to see the estimate.':r.capacity<0?'The proposed process takes more time.':r.capacity===0?'No change in total time.':'This time could be used on other work.');
    text('baseline',valid&&r.baseline!==null?fmt(r.baseline)+' h':'—');
    text('proposed',!valid?'—':r.proposed!==null?fmt(r.proposed)+' h':r.retained!==null?fmt(r.retained)+' h + unknown':'—');
    text('removed',valid&&r.removed!==null?fmt(r.removed)+' h':'—');
    text('added',valid&&r.added!==null?fmt(r.added)+' h':'Unknown');
    text('missing',!valid?'':r.missing.length?'Still needed: '+r.missing.join('; ')+'.':'All time inputs are complete.');
    $('missing-detail').hidden=!valid||r.missing.length===0;
    text('missing-summary',r.missing.length+' inputs remaining');
    text('capacity-value',valid?money(r.capacityValue):'—');
    text('economic-value',valid?money(r.economicValue):'—');
    text('roi',valid&&r.economicROI!==null?fmt(r.economicROI)+'%':'—');
    ['capacity-value','economic-value','roi'].forEach((id,i)=>{$(id).classList.toggle('negative',valid&&[r.capacityValue,r.economicValue,r.economicROI][i]!==null&&[r.capacityValue,r.economicValue,r.economicROI][i]<0);});
    text('cost-missing',!valid?'':r.capacity===null?'Add the remaining time inputs first.':r.costMissing.length?'Still needed: '+r.costMissing.join('; ')+'.':r.incrementalInvestment===0?'ROI cannot be calculated when added costs are zero.':'');
    r.stages.forEach((s,i)=>{const el=$('stage-hours-'+i);if(el)el.textContent=s.hours===null?'Stage hours unknown':fmt(s.hours)+' h · '+(s.isRemoved?'proposed removal':'retained');});
    const max=Math.max(r.baseline??0,r.proposed??r.retained??0,1);
    const seg=(v,cls)=>v!==null&&v>0?`<span class="bar ${cls}" style="width:${v/max*100}%"></span>`:'';
    $('chart').innerHTML=valid?`<div class="chart-row"><label>Current process · hours</label><div class="bar-track">${seg(r.retained,'kept')}${seg(r.removed,'removed')}</div></div><div class="chart-row"><label>Proposed process · hours</label><div class="bar-track">${seg(r.retained,'kept')}${seg(r.added,'added')}</div>${r.added===null?'<p class="unknown-addition">Review and setup time still needed.</p>':''}</div>`:'';
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
    const payload={title:'Colare hiring workload estimate',exportedAt:new Date().toISOString(),inputs:state,result,scope:'Estimate based on entered assumptions. Blank inputs are unknown. Dollar values reflect staff time.'};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Colare_Calculator_Inputs.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);text('export-status','Inputs and results exported.');
  });
  load(state);
  $('economics-detail').open=window.innerWidth>900;
})();
