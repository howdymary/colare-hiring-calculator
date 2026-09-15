(function(){
  'use strict';
  const $=id=>document.getElementById(id),model=window.CostModel;
  let state=model.preset();
  const money=v=>v===null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
  const hours=v=>v===null?'':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(v)+' hours / month';
  const text=(id,value)=>{$(id).textContent=value;};
  function render(){
    const r=model.calculate(state),v=r.valid;
    $('validation').hidden=v;text('validation',r.errors.join(' '));
    for(const [flag,fields,rows] of [['includeRecruiter','recruiter-fields','.recruiter-row'],['includeSetup','setup-fields','.setup-row'],['includeOther','other-fields','.other-row']]){
      $(fields).hidden=!state[flag];document.querySelectorAll(rows).forEach(el=>el.hidden=!state[flag]);
      $(fields).querySelectorAll('input').forEach(el=>el.disabled=!state[flag]);
    }
    for(const [id,key] of [['today','today'],['engineering-before','engineeringBefore'],['engineering-after','engineeringAfter'],['recruiter-before','recruiterBefore'],['recruiter-after','recruiterAfter'],['setup','setup'],['other-before','otherBefore'],['other-after','otherAfter']])text(id,v?money(r[key]):'—');
    const pendingFee=v&&r.withColare===null&&r.beforeFee!==null&&r.fee===null;
    text('with-colare',!v?'—':pendingFee?money(r.beforeFee)+' + quote':money(r.withColare));
    $('with-colare').classList.toggle('pending',pendingFee);
    text('fee',!v?'—':r.fee===null?'Add your quote':money(r.fee));
    text('hours-before',v?hours(r.hoursBefore):'');text('hours-after',v?hours(r.hoursAfter):'');
    const difference=v?r.difference:null,rounded=difference===null?null:Math.round(difference);
    text('difference',money(rounded===null?null:Math.abs(rounded)));
    text('difference-label',rounded===null?'Estimated cost difference':rounded>0?'Estimated monthly cost reduction':rounded<0?'Estimated monthly cost increase':'Estimated monthly cost difference');
    $('difference').classList.toggle('negative',rounded!==null&&rounded<0);
    text('difference-note',!v?'Check the input values.':difference===null?(pendingFee&&r.today!==null?'Add your Colare quote to complete the comparison.':'Complete the included costs to compare totals.'):rounded>0?'Lower cost under the assumptions you entered.':rounded<0?'The proposed approach costs more under these assumptions.':difference===0?'The two estimates are equal.':'The difference is less than $0.50 at this display precision.');
    const omitted=[];if(!state.includeRecruiter)omitted.push('recruiter time');if(!state.includeSetup)omitted.push('setup');if(!state.includeOther)omitted.push('other expenses');
    text('scope',omitted.length?'Excludes '+omitted.join(', ')+'. Add these on the left if they change.':'Includes recruiter time, setup and other expenses entered for this month.');
  }
  function load(s){state=s;for(const [key,val] of Object.entries(state)){const el=$(key);if(el.type==='checkbox')el.checked=val;else el.value=val??'';}render();}
  $('inputs').addEventListener('submit',e=>e.preventDefault());
  $('inputs').addEventListener('input',e=>{const el=e.target;if(!(el.id in state))return;state[el.id]=el.type==='checkbox'?el.checked:el.value===''?null:Number(el.value);render();});
  $('clear').addEventListener('click',()=>{load(model.empty());text('example','Enter your estimates. Blank costs stay unknown.');$('candidates').focus();});
  load(state);
})();
