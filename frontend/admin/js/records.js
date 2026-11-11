/* Administração: dados cadastrados, sem simulações de atividade ou faturamento. */
(() => {
  'use strict';
  const D = window.DafixData;
  const mode = document.querySelector('[data-record-page]').dataset.recordPage;
  const target = document.getElementById('records');
  let users = [], orders = [], services = [], headers = [], rows = [];
  function render() {
    const query = (document.getElementById('record-search').value || '').toLocaleLowerCase('pt-BR');
    const role = document.getElementById('record-role').value;
    if (mode === 'usuarios') {
      headers = ['Nome', 'E-mail', 'Telefone', 'Perfil', 'Especialidade'];
      rows = users.filter(u => !role || u.perfil === role).map(u => [u.nome,u.email,u.telefone,({cliente:'Cliente',funcionario:'Funcionário',admin:'Administrador'})[u.perfil],u.especialidade || 'Não informado']);
    } else if (mode === 'servicos') {
      headers = ['Serviço', 'Descrição', 'Preço base'];
      rows = services.map(service => [service.nome_servico, service.descricao || 'Não informado', D.money(service.preco_base)]);
    } else {
      headers = ['Pedido', 'Cliente', 'Funcionário', 'Serviço', 'Valor registrado', 'Data', 'Local'];
      rows = orders.map(o => ['#'+o.id,o.cliente,o.funcionario || 'Aguardando aceite',o.servico,D.money(o.preco_unitario),D.date(o.data),o.local]);
    }
    rows = rows.filter(row => row.some(value => String(value).toLocaleLowerCase('pt-BR').includes(query)));
    target.innerHTML = D.table(headers,rows,mode === 'usuarios' ? 'Nenhuma conta encontrada.' : mode === 'servicos' ? 'Nenhum serviço encontrado. Cadastre o primeiro serviço no formulário.' : 'Nenhum pedido encontrado.');
    document.getElementById('record-count').textContent = rows.length + ' registro(s)';
    document.getElementById('record-export').disabled = !rows.length;
  }
  let loading=false;
  async function load() {
    if(loading)return;loading=true;document.getElementById('record-reload').disabled=true;
    document.getElementById('record-search').disabled=true;document.getElementById('record-role').disabled=true;document.getElementById('record-export').disabled=true;
    target.innerHTML = D.empty('Carregando registros…');
    try {
      const [clients,staff,catalog,registered,admins] = await Promise.all([
        D.list('/api/clientes'),D.list('/api/funcionarios'),D.list('/api/servicos'),D.orders(),D.list('/api/admins')
      ]);
      users = clients.map(u=>({...u,perfil:'cliente'})).concat(staff.map(u=>({...u,perfil:'funcionario'})),admins.map(u=>({...u,perfil:'admin'})));
      services = catalog; orders = registered;
      document.getElementById('record-summary').innerHTML = [
        ['Clientes cadastrados',clients.length],['Funcionários cadastrados',staff.length],
        ['Serviços no catálogo',services.length],['Pedidos registrados',orders.length]
      ].map(([label,value])=>'<article><span>'+label+'</span><strong>'+value+'</strong></article>').join('');
      if (mode === 'relatorios') document.getElementById('report-total').textContent = D.money(orders.reduce((sum,o)=>sum+Number(o.preco_unitario || 0),0));
      document.getElementById('record-search').disabled=false;document.getElementById('record-role').disabled=false;
      render();
    } catch(error) {
      target.innerHTML = D.empty(error.message);
      document.getElementById('record-count').textContent = 'Dados indisponíveis';
      document.getElementById('record-summary').innerHTML = D.empty('Não foi possível carregar o resumo. Use Atualizar para tentar novamente.');
      document.getElementById('record-export').disabled = true;
    } finally {loading=false;document.getElementById('record-reload').disabled=false;}
  }
  document.getElementById('record-search').addEventListener('input',render);
  document.getElementById('record-role').addEventListener('change',render);
  document.getElementById('record-reload').addEventListener('click',load);
  document.getElementById('record-export').addEventListener('click',()=>D.csv('dafix-'+mode+'.csv',headers,rows));
  document.addEventListener('dafix:person-created',load);
  load();
})();
