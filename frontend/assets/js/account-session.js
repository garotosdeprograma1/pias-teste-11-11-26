/* Dados da conta conectada e preferências locais isoladas por perfil e ID. */
(() => {
  'use strict';

  const SESSION_KEY = 'dafix_session';
  const routes = {
    admin: '/admin/dashboard.html',
    cliente: '/cliente/index.html',
    funcionario: '/funcionario/funcionario-dashboard.html',
  };
  const text = (value) => typeof value === 'string' ? value : '';
  let activeSession = null;

  function readSession() {
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        const storage = window[name];
        const value = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
        if (value && Object.hasOwn(routes, value.perfil) &&
            Number.isSafeInteger(Number(value.id)) && Number(value.id) > 0 &&
            text(value.nome).trim() && text(value.email).trim()) {
          return {
            id: Number(value.id), perfil: value.perfil,
            nome: text(value.nome), email: text(value.email),
            telefone: text(value.telefone), especialidade: text(value.especialidade),
            loginAt: Number(value.loginAt) || 0,
          };
        }
      } catch { /* Sessão ausente, antiga ou inválida: tentar o próximo armazenamento. */ }
    }
    return null;
  }

  const identity = (session) => session ? session.perfil + ':' + session.id : '';

  function requireProfile(profile) {
    const session = readSession();
    if (!session || session.perfil !== profile) {
      window.location.replace(session ? routes[session.perfil] : '/index.html');
      return null;
    }
    activeSession = session;
    return session;
  }

  function key(name) {
    return 'dafix_account:' + (identity(activeSession || readSession()) || 'signed-out') + ':' + name;
  }

  function source(session) {
    return {
      name: session.nome, email: session.email,
      phone: session.telefone, specialty: session.especialidade,
    };
  }

  function cleanProfile(value) {
    const result = {};
    for (const field of ['name', 'email', 'phone', 'specialty', 'address', 'city', 'bio']) {
      result[field] = text(value[field]);
    }
    for (const field of ['photo', 'avatar']) {
      const image = text(value[field]);
      result[field] = /^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|preset:g[1-6])$/.test(image) ? image : null;
    }
    result.prefs = {
      email: Boolean(value.prefs?.email),
      sms: Boolean(value.prefs?.sms),
      news: Boolean(value.prefs?.news),
    };
    return result;
  }

  function loadProfile() {
    const session = activeSession || readSession();
    const base = cleanProfile(session ? source(session) : {});
    if (!session) return base;
    try {
      const saved = JSON.parse(localStorage.getItem(key('profile')) || 'null');
      if (saved?.profile && saved?.source) {
        const profile = cleanProfile(saved.profile);
        // O cadastro atual prevalece se seus dados mudaram desde a edição local.
        for (const field of ['name', 'email', 'phone', 'specialty']) {
          if (saved.source[field] !== base[field]) profile[field] = base[field];
        }
        return profile;
      }
    } catch { /* Preferências corrompidas não substituem o cadastro. */ }
    return base;
  }

  function saveProfile(value) {
    const current = readSession();
    const session = activeSession || current;
    if (!current || identity(current) !== identity(session)) {
      throw new Error('A conta conectada mudou. Entre novamente antes de salvar.');
    }
    const profile = cleanProfile(value);
    // Estes complementos são locais; não são uma atualização do banco de dados.
    localStorage.setItem(key('profile'), JSON.stringify({ source: source(current), profile }));
    return profile;
  }

  function startSession(user, profile) {
    if (!user || !Object.hasOwn(routes, profile) || !Number.isSafeInteger(Number(user.id)) ||
        Number(user.id) < 1 || !text(user.nome).trim() || !text(user.email).trim()) {
      throw new Error('Dados de acesso inválidos.');
    }
    const session = {
      id: Number(user.id), nome: user.nome, email: user.email,
      telefone: text(user.telefone), especialidade: text(user.especialidade),
      perfil: profile, loginAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* O acesso principal já foi salvo. */ }
    return session;
  }

  // Uma aba aberta não deve continuar mostrando ou editando outra conta após a troca.
  function refreshSession() {
    if (!activeSession) return;
    const current = readSession();
    if (!current) window.location.replace('/index.html');
    else if (identity(current) !== identity(activeSession) || current.loginAt !== activeSession.loginAt) {
      window.location.replace(routes[current.perfil]);
    }
  }
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_KEY || event.key === null) refreshSession();
  });
  window.addEventListener('pageshow', refreshSession);

  async function logout(destination = '/index.html') {
    const response = await fetch('/api/logout', {method:'POST'});
    if (!response.ok) throw new Error('Não foi possível encerrar a sessão. Tente novamente.');
    for (const name of ['localStorage','sessionStorage']) { try { window[name].removeItem(SESSION_KEY); } catch {} }
    window.location.replace(destination);
  }
  window.DafixAccount = { logout, readSession, requireProfile, key, loadProfile, saveProfile, startSession };
})();
