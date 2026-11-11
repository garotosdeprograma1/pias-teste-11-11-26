'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../frontend/assets/js/account-session.js'), 'utf8');
const CLIENT = { id: 1, nome: 'Ana Ribeiro', email: 'ana@example.test', telefone: '11912345678', perfil: 'cliente', loginAt: 100 };
const EMPLOYEE = { id: 1, nome: 'Lia Costa', email: 'lia@example.test', telefone: '21912345678', especialidade: 'Jardinagem', perfil: 'funcionario', loginAt: 200 };

function storage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key) => entries.has(key) ? entries.get(key) : null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
    clear: () => entries.clear(),
    entries,
  };
}

function browser(local = storage(), session = storage()) {
  const events = new Map();
  const redirects = [];
  const window = {
    localStorage: local,
    sessionStorage: session,
    location: { replace: (url) => redirects.push(url) },
    addEventListener: (event, listener) => events.set(event, listener),
  };
  const context = vm.createContext({ window, localStorage: local, sessionStorage: session });
  vm.runInContext(script, context);
  return { account: window.DafixAccount, window, local, session, redirects, fire: (name, value) => events.get(name)?.(value) };
}

function signIn(local, user) { local.setItem('dafix_session', JSON.stringify(user)); }

test('reads registration fields and ignores global demonstration profiles', () => {
  const local = storage({
    sh_user: JSON.stringify({ name: 'Carlos Andrade', email: 'demo@example.test', phone: '000', address: 'Rua demonstrativa' }),
    'mda.pro.profile': JSON.stringify({ name: 'Carlos Ramos', city: 'Cidade demonstrativa' }),
  });
  signIn(local, CLIENT);
  const { account } = browser(local);
  account.requireProfile('cliente');
  const profile = account.loadProfile();
  assert.equal(profile.name, CLIENT.nome);
  assert.equal(profile.email, CLIENT.email);
  assert.equal(profile.phone, CLIENT.telefone);
  assert.equal(profile.address, '');
  assert.equal(profile.city, '');
  assert.equal(profile.avatar, null);
});

test('isolates client, employee and another client even when database IDs overlap', () => {
  const local = storage();
  signIn(local, CLIENT);
  const first = browser(local).account;
  first.requireProfile('cliente');
  first.saveProfile({ ...first.loadProfile(), address: 'Endereço da Ana', avatar: 'preset:g2' });
  const clientKey = first.key('profile');

  signIn(local, EMPLOYEE);
  const second = browser(local).account;
  second.requireProfile('funcionario');
  assert.equal(second.loadProfile().name, EMPLOYEE.nome);
  assert.equal(second.loadProfile().specialty, EMPLOYEE.especialidade);
  assert.equal(second.loadProfile().address, '');
  assert.equal(second.loadProfile().avatar, null);
  assert.notEqual(second.key('profile'), clientKey);
  second.saveProfile({ ...second.loadProfile(), city: 'Cidade da Lia' });

  signIn(local, { ...CLIENT, id: 2, nome: 'Bia Teixeira', email: 'bia@example.test' });
  const third = browser(local).account;
  third.requireProfile('cliente');
  assert.equal(third.loadProfile().name, 'Bia Teixeira');
  assert.equal(third.loadProfile().address, '');
  assert.equal(third.loadProfile().city, '');

  signIn(local, CLIENT);
  const returning = browser(local).account;
  returning.requireProfile('cliente');
  assert.equal(returning.loadProfile().address, 'Endereço da Ana');
  assert.equal(returning.loadProfile().avatar, 'preset:g2');
});

test('registration updates replace stale base fields while keeping account additions', () => {
  const local = storage();
  signIn(local, EMPLOYEE);
  const original = browser(local).account;
  original.requireProfile('funcionario');
  original.saveProfile({ ...original.loadProfile(), name: 'Nome editado localmente', city: 'Curitiba', bio: 'Descrição local' });
  signIn(local, { ...EMPLOYEE, nome: 'Lia Costa Silva', telefone: '31988887777', especialidade: 'Pintura' });
  const updated = browser(local).account;
  updated.requireProfile('funcionario');
  const profile = updated.loadProfile();
  assert.equal(profile.name, 'Lia Costa Silva');
  assert.equal(profile.phone, '31988887777');
  assert.equal(profile.specialty, 'Pintura');
  assert.equal(profile.city, 'Curitiba');
  assert.equal(profile.bio, 'Descrição local');
});

test('missing optional data stays empty and corrupt profile storage cannot restore demo data', () => {
  const local = storage();
  signIn(local, { ...CLIENT, telefone: undefined });
  const { account } = browser(local);
  account.requireProfile('cliente');
  local.setItem(account.key('profile'), '{invalid json');
  const profile = account.loadProfile();
  assert.equal(profile.name, CLIENT.nome);
  for (const field of ['phone', 'address', 'city', 'specialty', 'bio']) assert.equal(profile[field], '');
});

test('guards missing, malformed and wrong-role sessions', () => {
  const absent = browser();
  assert.equal(absent.account.requireProfile('cliente'), null);
  assert.deepEqual(absent.redirects, ['/index.html']);
  const malformed = browser(storage({ dafix_session: '{broken' }));
  assert.equal(malformed.account.readSession(), null);
  const wrongRole = browser();
  signIn(wrongRole.local, EMPLOYEE);
  assert.equal(wrongRole.account.requireProfile('cliente'), null);
  assert.deepEqual(wrongRole.redirects, ['/funcionario/funcionario-dashboard.html']);
});

test('logout and cross-tab account switches refresh protected pages', () => {
  const local = storage();
  signIn(local, CLIENT);
  const first = browser(local);
  first.account.requireProfile('cliente');
  signIn(local, EMPLOYEE);
  first.fire('storage', { key: 'dafix_session' });
  assert.deepEqual(first.redirects, ['/funcionario/funcionario-dashboard.html']);
  local.removeItem('dafix_session');
  first.fire('pageshow');
  assert.equal(first.redirects.at(-1), '/index.html');
});

test('rejects profile saves after logout or account change without touching either profile', () => {
  const local = storage();
  signIn(local, CLIENT);
  const current = browser(local).account;
  current.requireProfile('cliente');
  const profile = { ...current.loadProfile(), address: 'Só pertence à Ana' };
  signIn(local, EMPLOYEE);
  assert.throws(() => current.saveProfile(profile), /conta conectada mudou/);
  assert.equal(local.getItem('dafix_account:funcionario:1:profile'), null);
  assert.equal(local.getItem('dafix_account:cliente:1:profile'), null);
  local.removeItem('dafix_session');
  assert.throws(() => current.saveProfile(profile), /conta conectada mudou/);
});

test('stores only public login fields and preserves phone and specialty', () => {
  const { account, local, session } = browser();
  session.setItem('dafix_session', JSON.stringify(CLIENT));
  account.startSession({ ...EMPLOYEE, senha: 'synthetic-test-password', cpf: 'synthetic-private-id', token: 'unused-secret' }, 'funcionario');
  const saved = JSON.parse(local.getItem('dafix_session'));
  assert.deepEqual(Object.keys(saved).sort(), ['id', 'nome', 'email', 'telefone', 'especialidade', 'perfil', 'loginAt'].sort());
  assert.equal(saved.telefone, EMPLOYEE.telefone);
  assert.equal(saved.especialidade, EMPLOYEE.especialidade);
  assert.equal(session.getItem('dafix_session'), null);
});

test('blocked browser storage cannot crash the session guard and successful local login survives optional storage failure', () => {
  const context = browser();
  Object.defineProperty(context.window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  Object.defineProperty(context.window, 'sessionStorage', { get() { throw new Error('Storage blocked'); } });
  assert.equal(context.account.requireProfile('cliente'), null);
  assert.deepEqual(context.redirects, ['/index.html']);

  const optionalBlocked = browser(storage(), { removeItem() { throw new Error('Storage blocked'); } });
  assert.doesNotThrow(() => optionalBlocked.account.startSession(CLIENT, 'cliente'));
  assert.equal(optionalBlocked.account.readSession().nome, CLIENT.nome);
});

test('profile storage errors remain visible and non-image profile URLs are discarded', () => {
  const local = storage();
  signIn(local, CLIENT);
  const account = browser(local).account;
  account.requireProfile('cliente');
  const saved = account.saveProfile({ ...account.loadProfile(), photo: 'javascript:alert(1)', avatar: 'https://unknown.example/image.png', senha: 'never store this' });
  assert.equal(saved.photo, null);
  assert.equal(saved.avatar, null);
  assert.equal(Object.hasOwn(saved, 'senha'), false);
  local.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => account.saveProfile(saved), /Quota exceeded/);
});
