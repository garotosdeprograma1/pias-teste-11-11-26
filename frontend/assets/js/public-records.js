/* Catálogo público carregado do cadastro, sem avaliações, contatos ou métricas inventadas. */
(() => {
  'use strict';
  const D=window.DafixData;
  const e=D.escape;
  let professionals=[];
  const targets=['#featuredPros','#prosGrid','#landingProfessionals','#categoriesGrid','#landingServices','#heroStats','#statsGrid','#instHeroStats','#landingStats'];
  const set=(selector,html)=>document.querySelectorAll(selector).forEach(el=>{el.innerHTML=html});
  function renderPros() {
    const search=(document.getElementById('searchInput')?.value || '').toLocaleLowerCase('pt-BR');
    const specialty=document.getElementById('filterCat')?.value || '';
    const visible=professionals.filter(p=>(!specialty||p.especialidade===specialty)&&[p.nome,p.especialidade].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(search)));
    const html=list=>list.length?list.map(p=>'<article class="pro-card"><div class="pro-body"><h3 class="pro-name">'+e(p.nome)+'</h3><p>'+e(p.especialidade || 'Especialidade não informada')+'</p></div></article>').join(''):D.empty('Nenhum profissional encontrado.');
    set('#prosGrid',html(visible));set('#featuredPros,#landingProfessionals',html(professionals));
    const count=document.getElementById('resultsCount');if(count)count.textContent=visible.length+' profissional(is) encontrado(s)';
  }
  async function load() {
    try {
      const [staff,summary,services]=await Promise.all([D.list('/api/profissionais'),D.request('/api/resumo'),D.list('/api/servicos')]);
      professionals=staff;
      const specialties=[...new Set(staff.map(p=>p.especialidade).filter(Boolean))];
      const filter=document.getElementById('filterCat');
      if(filter){filter.replaceChildren(new Option('Todas as especialidades',''));specialties.forEach(name=>filter.add(new Option(name,name)));}
      const params=new URLSearchParams(location.search);
      const input=document.getElementById('searchInput');if(input)input.value=params.get('q') || '';
      if(filter&&specialties.includes(params.get('cat')))filter.value=params.get('cat');
      renderPros();
      set('#categoriesGrid',specialties.length?specialties.map(name=>'<a class="cat-card" href="/publico/servicos.html?cat='+encodeURIComponent(name)+'"><p class="cat-name">'+e(name)+'</p><p>'+staff.filter(p=>p.especialidade===name).length+' profissional(is)</p></a>').join(''):D.empty('Nenhuma especialidade cadastrada.'));
      set('#landingServices',services.length?services.map(s=>'<article class="service-card"><h3>'+e(s.nome_servico)+'</h3><p>'+e(s.descricao || '')+'</p><strong>'+D.money(s.preco_base)+'</strong></article>').join(''):D.empty('Nenhum serviço cadastrado.'));
      const stats=[['Clientes cadastrados',summary.clientes],['Profissionais cadastrados',summary.funcionarios],['Pedidos registrados',summary.pedidos]];
      set('#heroStats,#statsGrid,#instHeroStats,#landingStats',stats.map(([label,count])=>'<article class="stat-card"><strong class="stat-val">'+e(count)+'</strong><p class="stat-label">'+label+'</p></article>').join(''));
    } catch(error) {targets.forEach(selector=>set(selector,D.empty(error.message)));const count=document.getElementById('resultsCount');if(count)count.textContent='Dados indisponíveis';}
  }
  document.getElementById('searchInput')?.addEventListener('input',renderPros);
  document.getElementById('filterCat')?.addEventListener('change',renderPros);
  document.getElementById('resetSearch')?.addEventListener('click',()=>{document.getElementById('searchInput').value='';document.getElementById('filterCat').value='';renderPros()});
  document.getElementById("searchBtn")?.addEventListener("click",renderPros);
  document.getElementById("clearFilters")?.addEventListener("click",()=>{document.getElementById("searchInput").value="";document.getElementById("filterCat").value="";renderPros()});
  load();
})();
