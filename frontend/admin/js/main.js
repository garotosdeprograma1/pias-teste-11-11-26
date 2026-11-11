(() => {
  const root=document.documentElement,themeButton=document.querySelector('.theme-btn');
  function applyTheme(theme){root.dataset.theme=theme;themeButton.setAttribute('aria-label',theme==='dark'?'Ativar tema claro':'Ativar tema escuro');themeButton.title=themeButton.getAttribute('aria-label');}
  let saved='light';try{saved=localStorage.getItem('dafix_theme')||'light';}catch{}
  applyTheme(saved==='dark'?'dark':'light');
  themeButton.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('dafix_theme',next);}catch{}});
  const menu=document.getElementById('sidebar'),button=document.getElementById('menuBtn'),overlay=document.getElementById('mobOverlay');
  function close(){menu.classList.remove('open');overlay.hidden=true;button.setAttribute('aria-expanded','false');document.body.style.overflow='';}
  button.addEventListener('click',()=>{if(menu.classList.contains('open')){close();return;}menu.classList.add('open');overlay.hidden=false;button.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';});
  document.getElementById('closeMenu').addEventListener('click',()=>{close();button.focus()});overlay.addEventListener('click',close);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('open')){close();button.focus()}});
  window.addEventListener('resize',()=>{if(innerWidth>900)close()});
  fetch('/api/session').then(async response => {
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.perfil !== 'admin') throw new Error();
    window.DafixAccount.startSession(data.usuario,'admin');
    window.DafixAccount.requireProfile('admin');
    document.getElementById('admin-name').textContent=data.usuario.nome;
  }).catch(()=>location.replace('/admin-login.html'));
  const dialog=document.getElementById('admin-logout-dialog');
  document.querySelectorAll('[data-admin-logout]').forEach(button=>button.addEventListener('click',()=>{close();dialog.showModal();}));
  document.getElementById('logout-cancel').addEventListener('click',()=>dialog.close());
  document.getElementById('logout-confirm').addEventListener('click',async event=>{
    event.target.disabled=true;
    try { await window.DafixAccount.logout('/admin-login.html'); }
    catch(error) { document.getElementById('logout-error').textContent=error.message;event.target.disabled=false; }
  });
})();
