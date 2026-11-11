(() => {
  try { document.documentElement.dataset.theme=localStorage.getItem('dafix_theme')==='dark'?'dark':'light'; } catch {}
  const form=document.getElementById('admin-login-form'),message=document.getElementById('login-message'),button=form.querySelector('button');
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(button.disabled)return;button.disabled=true;message.textContent='Verificando acesso…';
    try {
      const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({perfil:'admin',email:form.elements.email.value,senha:form.elements.senha.value})});
      const data=await response.json();if(!response.ok)throw new Error(data.erro || 'Não foi possível entrar.');
      window.DafixAccount.startSession(data.usuario,'admin');location.replace('/admin/dashboard.html');
    } catch(error){message.textContent=error.message;button.disabled=false;}
  });
})();
