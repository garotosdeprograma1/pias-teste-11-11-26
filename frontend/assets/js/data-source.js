/* Somente registros reais da API. Falhas de conexão não são listas vazias. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  async function request(path, options = {}) {
    let response;
    try { response = await fetch(path, { cache: 'no-store', ...options }); }
    catch { throw new Error('Não foi possível conectar ao servidor. Tente novamente.'); }
    let data;
    try { data = await response.json(); }
    catch { throw new Error('Não foi possível carregar os dados. Abra o projeto pelo servidor.'); }
    if (response.status === 401 && location.pathname !== '/admin-login.html') { location.replace(location.pathname.startsWith('/admin/') ? '/admin-login.html' : '/index.html'); }
    if (!response.ok) throw new Error(data.erro || 'Não foi possível carregar os dados.');
    return data;
  }
  const list = async path => {
    const data = await request(path);
    if (!Array.isArray(data)) throw new Error('Resposta de dados inválida.');
    return data;
  };
  const money = value => Number.isFinite(Number(value)) && value !== null ? Number(value).toLocaleString('pt-BR', {style:'currency',currency:'BRL'}) : 'Não informado';
  const date = value => {
    if (!value) return 'Não informado';
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value);
    return Number.isNaN(parsed.getTime()) ? 'Não informado' : parsed.toLocaleDateString('pt-BR');
  };
  const empty = message => '<p class="data-empty" role="status">' + escape(message) + '</p>';
  function table(headers, rows, message = 'Nenhum registro cadastrado.') {
    if (!rows.length) return empty(message);
    return '<div class="data-table-wrap"><table class="data-table"><thead><tr>' + headers.map(h=>'<th>'+escape(h)+'</th>').join('') + '</tr></thead><tbody>' + rows.map(row=>'<tr>'+row.map(cell=>'<td>'+escape(cell ?? 'Não informado')+'</td>').join('')+'</tr>').join('') + '</tbody></table></div>';
  }
  function csv(filename, headers, rows) {
    const cell = value => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const url = URL.createObjectURL(new Blob(['\uFEFF' + [headers,...rows].map(row=>row.map(cell).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const orders = session => list('/api/os' + (session ? '?perfil='+encodeURIComponent(session.perfil)+'&id='+encodeURIComponent(session.id) : ''));
  window.DafixData = { request, list, escape, money, date, empty, table, csv, orders };
})();
