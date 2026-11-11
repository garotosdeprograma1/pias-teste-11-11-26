/* Pedidos e agenda da conta conectada. Nenhum estado ou avaliação é presumido. */
(() => {
  'use strict';
  const D=window.DafixData;
  const session=window.DafixAccount.requireProfile('funcionario');
  if(!session) return;
  let available=[],orders=[],month=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const table = list => D.table(['Pedido','Cliente','Serviço','Data','Local','Valor registrado'],list.map(o=>['#'+o.id,o.cliente,o.servico,D.date(o.data),o.local,D.money(o.preco_unitario)]),'Nenhum pedido cadastrado para esta conta.');
  function renderOrders() {
    const target=document.getElementById('registeredOrders');if(!target)return;
    renderAvailable();
    const query=(document.getElementById('registeredSearch')?.value || '').toLocaleLowerCase('pt-BR');
    target.innerHTML=table(orders.filter(o=>[o.cliente,o.servico,o.id].some(v=>String(v).toLocaleLowerCase('pt-BR').includes(query))));
  }
  const target=document.getElementById('registeredOrders');
  if(target){
    const section=document.createElement('section');section.className='data-panel';
    section.innerHTML='<div class="available-heading"><h2>Pedidos disponíveis</h2><button type="button" class="btn btn--ghost" id="orders-refresh">Atualizar pedidos</button></div><p>Escolha um pedido para assumir o atendimento.</p><p id="accept-message" role="status"></p><div id="available-orders"></div>';
    target.before(section);
    document.getElementById('orders-refresh').addEventListener('click',load);
    section.addEventListener('click',async event=>{
      const button=event.target.closest('[data-accept-order]');if(!button)return;
      button.disabled=true;
      const message=document.getElementById('accept-message');message.textContent='Confirmando aceite…';
      try {
        await D.request('/api/os/'+button.dataset.acceptOrder+'/aceitar',{method:'POST'});
        message.textContent='Pedido aceito. Ele já aparece nos seus pedidos e na agenda.';
      } catch(error){message.textContent=error.message;}
      await load();
    });
  }
  function renderAvailable(){
    const target=document.getElementById('available-orders');if(!target)return;
    const query=(document.getElementById('registeredSearch')?.value || '').toLocaleLowerCase('pt-BR');
    const matching=available.filter(o=>[o.cliente,o.servico,o.id].some(v=>String(v).toLocaleLowerCase('pt-BR').includes(query)));
    target.innerHTML=matching.length?matching.map(o=>'<article class="available-order"><div><h3>'+D.escape(o.servico)+'</h3><p>Pedido #'+o.id+' · '+D.escape(o.cliente)+'</p><p>'+D.date(o.data)+' · '+D.escape(o.local)+'</p><p>'+D.escape(o.descricao)+'</p><strong>'+D.money(o.preco_unitario)+'</strong></div><button type="button" class="btn btn--primary" data-accept-order="'+o.id+'">Aceitar pedido</button></article>').join(''):D.empty('Nenhum pedido aguardando aceite no momento.');
  }
  function calendar() {
    const grid=document.getElementById('calGrid');if(!grid)return;
    document.getElementById('calTitle').textContent=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    grid.replaceChildren();
    ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(day=>{const el=document.createElement('div');el.className='calendar__weekday';el.textContent=day;grid.append(el)});
    for(let i=0;i<month.getDay();i++)grid.append(document.createElement('span'));
    const today=new Date();
    for(let day=1;day<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();day++){
      const key=[month.getFullYear(),String(month.getMonth()+1).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
      const list=orders.filter(o=>String(o.data).slice(0,10)===key);
      const button=document.createElement('button');button.type='button';button.className='calendar__day';
      if(month.getFullYear()===today.getFullYear()&&month.getMonth()===today.getMonth()&&day===today.getDate())button.classList.add('calendar__day--today');
      button.innerHTML='<span class="calendar__day-num">'+day+'</span>'+(list.length?'<span>'+list.length+' pedido(s)</span>':'');
      button.setAttribute('aria-label',D.date(key)+': '+list.length+' pedido(s)');
      button.addEventListener('click',()=>document.getElementById('registeredOrders').innerHTML=table(list));
      grid.append(button);
    }
  }
  async function load() {
    const target=document.getElementById('registeredOrders');
    try {
      const all=await D.orders(session);
      available=all.filter(o=>o.id_funcionario===null);
      orders=all.filter(o=>o.id_funcionario===session.id);
      renderAvailable();
      const summary=document.getElementById('employeeSummary');
      if(summary) summary.innerHTML=[['Meus pedidos',orders.length],['Disponíveis para aceite',available.length],['Clientes vinculados',new Set(orders.map(o=>o.id_cliente)).size]].map(([label,value])=>'<article><span>'+label+'</span><strong>'+value+'</strong></article>').join('');
      renderOrders();calendar();
      const catalog=document.getElementById('registeredCatalog');
      if(catalog){const items=await D.list('/api/servicos');catalog.innerHTML=D.table(['Serviço','Descrição','Preço base'],items.map(s=>[s.nome_servico,s.descricao || 'Não informado',D.money(s.preco_base)]),'Nenhum serviço cadastrado.');}
    } catch(error) {
      if(target) target.innerHTML=D.empty(error.message);
      const availableTarget=document.getElementById('available-orders');if(availableTarget)availableTarget.innerHTML=D.empty(error.message);
      const catalog=document.getElementById('registeredCatalog');if(catalog)catalog.innerHTML=D.empty(error.message);
    }
  }
  document.getElementById('registeredSearch')?.addEventListener('input',renderOrders);
  document.querySelectorAll('[data-calendar-step]').forEach(button=>button.addEventListener('click',()=>{
    month.setMonth(month.getMonth()+Number(button.dataset.calendarStep));calendar();
  }));
  document.getElementById('registeredExport')?.addEventListener('click',()=>D.csv('pedidos.csv',['Pedido','Cliente','Serviço','Data','Local','Valor'],orders.map(o=>[o.id,o.cliente,o.servico,o.data,o.local,o.preco_unitario])));
  document.getElementById('globalSearch')?.addEventListener('input',event=>{
    const input=document.getElementById('registeredSearch');
    if(input){input.value=event.target.value;renderOrders();}
    document.querySelectorAll('#registeredCatalog tbody tr').forEach(row=>row.hidden=!row.textContent.toLocaleLowerCase('pt-BR').includes(event.target.value.toLocaleLowerCase('pt-BR')));
  });
  window.addEventListener('focus',load);
  load();
})();
