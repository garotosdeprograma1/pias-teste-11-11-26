/* Solicitações reais do catálogo. */
(() => {
  const D=window.DafixData, dialog=document.getElementById('request-dialog'), form=document.getElementById('request-form');
  const message=document.getElementById('request-message'), submit=form.querySelector('[type="submit"]');
  let selected=null, account=null, busy=false;
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-request-service]');if(!button)return;
    account=window.DafixAccount.requireProfile('cliente');if(!account)return;
    selected=Number(button.dataset.requestService.replace('service-',''));form.reset();submit.disabled=false;
    message.textContent='A solicitação ficará aguardando o aceite de um profissional.';
    document.getElementById('request-title').textContent='Solicitar '+button.closest('article').querySelector('h3').textContent;
    document.getElementById('request-date').min=new Date().toLocaleDateString('en-CA');
    dialog.showModal();
  });
  dialog.querySelector('[data-request-close]').addEventListener('click',()=>{if(!busy)dialog.close()});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!form.reportValidity())return;
    const current=window.DafixAccount.readSession();if(!current||current.perfil!=='cliente'||current.id!==account.id){message.textContent='Sua conta mudou. Entre novamente antes de solicitar.';return;}
    busy=true;submit.disabled=true;message.textContent='Registrando pedido…';
    try{const result=await D.request('/api/solicitacoes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_servico:selected,data:form.elements.data.value,local:form.elements.local.value,descricao:form.elements.descricao.value})});dialog.close();document.dispatchEvent(new CustomEvent('dafix:order-created',{detail:result}));}
    catch(error){message.textContent=error.message;}
    finally{busy=false;submit.disabled=false;}
  });
})();
