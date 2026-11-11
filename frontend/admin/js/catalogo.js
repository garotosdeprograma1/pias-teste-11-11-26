(() => {
  const form=document.getElementById('catalog-form'),status=document.getElementById('catalog-message'),button=form.querySelector('[type="submit"]');
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity()||button.disabled)return;button.disabled=true;status.textContent='Salvando serviço…';
    try{await window.DafixData.request('/api/servicos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome_servico:form.elements.nome.value.trim(),descricao:form.elements.descricao.value.trim(),preco_base:Number(form.elements.preco.value)})});form.reset();status.textContent='Serviço cadastrado. Já está disponível para solicitação na área do cliente.';document.getElementById('record-reload').click();}
    catch(error){status.textContent=error.message;}finally{button.disabled=false;}
  });
})();
