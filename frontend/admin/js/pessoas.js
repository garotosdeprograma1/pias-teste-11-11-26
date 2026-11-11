/* Cadastro no contexto administrativo; a sessão atual é preservada. */
(() => {
  'use strict';
  const dialog = document.getElementById('person-dialog');
  const form = document.getElementById('person-form');
  const message = document.getElementById('person-message');
  const success = document.getElementById('person-success');
  const specialty = document.getElementById('person-specialty');
  let saving = false;
  function updateRole() {
    const staff = form.elements.perfil.value === 'funcionario';
    specialty.hidden = !staff;
    form.elements.especialidade.disabled = !staff;
    form.elements.especialidade.required = staff;
  }
  document.getElementById('person-open').addEventListener('click', () => {
    form.reset(); updateRole(); message.textContent = ''; success.hidden = true; dialog.showModal();
  });
  function close() { if (!saving) dialog.close(); }
  document.getElementById('person-close').addEventListener('click', close);
  document.getElementById('person-cancel').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) close();
  });
  form.elements.perfil.addEventListener('change', updateRole);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const endpoint = {cliente:'clientes',funcionario:'funcionarios',admin:'admins'}[data.perfil];
    delete data.perfil;
    saving = true; message.textContent = 'Salvando cadastro…';
    form.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try {
      await window.DafixData.request('/api/' + endpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      dialog.close();
      success.textContent = 'Cadastro de ' + data.nome.trim() + ' realizado com sucesso.';
      success.hidden = false;
      document.dispatchEvent(new Event('dafix:person-created'));
    } catch (error) { message.textContent = error.message; }
    finally { saving = false; form.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
  });
})();
