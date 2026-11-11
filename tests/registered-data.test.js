'use strict';

// Executar após npm ci --prefix backend: node --test tests/registered-data.test.js
// Cada execução cria e remove seu próprio SQLite, fora do banco do projeto.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
let directory, child, origin;

before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dafix-registered-test-'));
  const backend = path.resolve(__dirname, '../backend');
  fs.copyFileSync(path.join(backend, 'db.js'), path.join(directory, 'db.js'));
  fs.copyFileSync(path.join(backend, 'auth.js'), path.join(directory, 'auth.js'));
  fs.copyFileSync(path.join(backend, 'criar-admin.js'), path.join(directory, 'criar-admin.js'));

  fs.symlinkSync(path.join(backend, 'node_modules'), path.join(directory, 'node_modules'));
  const source = fs.readFileSync(path.join(backend, 'server.js'), 'utf8')
    .replaceAll("'../frontend'",JSON.stringify(path.resolve(__dirname,'../frontend')))
    .replace('var PORTA = 5000;', 'var PORTA = 0;')
    .replace("var HOST = 'localhost';", "var HOST = '127.0.0.1';")
    .replace("console.log('  Pronto! Gravando em banco.db (SQLite).');", "console.log('TEST_PORT=' + servidor.address().port);");
  fs.writeFileSync(path.join(directory, 'server.js'), source);
  child = spawn(process.execPath, [path.join(directory, 'server.js')], { stdio: ['ignore', 'pipe', 'pipe'] });
  origin = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('O servidor de teste não iniciou.')), 10000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); reject(new Error('Servidor encerrou: ' + code)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const found = output.match(/TEST_PORT=(\d+)/);
      if (found) { clearTimeout(timeout); resolve('http://127.0.0.1:' + found[1]); }
    });
  });
});

after(async () => {
  if (child && child.exitCode === null) await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

async function request(endpoint, body, cookie='') {
  const response = await fetch(origin + endpoint, {method:body!==undefined?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:cookie},...(body!==undefined?{body:JSON.stringify(body)}:{}),redirect:'manual'});
  const data=await response.json().catch(()=>null);
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0],location:response.headers.get('location')};
}

const account={nome:'Conta de teste',email:'cliente@example.test',cpf:'52998224725',telefone:'11999998888',senha:'SenhaTeste123'};
test('server authorization, private orders and atomic professional acceptance', async()=>{
  assert.equal((await request('/api/admins')).status,401);
  assert.equal((await request('/api/admins',account)).status,401);
  assert.equal((await request('/admin/dashboard.html')).location,'/admin-login.html');
  assert.equal((await request('/api/servicos',{nome_servico:'Teste',preco_base:95})).status,401);
  assert.equal((await request('/api/clientes',account)).status,201);
  assert.equal((await request('/api/clientes',account)).status,409);
  const other=await request('/api/clientes',{...account,nome:'Outra pessoa',email:'outra@example.test',cpf:'11144477735'});
  assert.equal(other.status,201);
  for(const email of ['profissional@example.test','outro@example.test'])assert.equal((await request('/api/funcionarios',{...account,email,cpf:email.startsWith('outro')?'11144477735':account.cpf,especialidade:'Instalações'})).status,201);
  const login=async(perfil,email=account.email)=>request('/api/login',{perfil,email,senha:account.senha});
  const client=await login('cliente'),staff=await login('funcionario','profissional@example.test'),staff2=await login('funcionario','outro@example.test');
  assert.equal(client.status,200);assert(client.cookie);assert(!('senha' in client.data.usuario));
  assert.equal((await request('/api/admins',account,client.cookie)).status,403);
  assert.equal((await request('/api/clientes',undefined,staff.cookie)).status,403);
  assert.equal((await request('/admin/dashboard.html',undefined,client.cookie)).status,302);
  await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[path.join(directory,'criar-admin.js'),account.email]);p.on('exit',code=>code?reject(new Error('Falha ao criar administrador')):resolve());p.on('error',reject)});
  const admin=await login('admin');assert.equal(admin.status,200);
  assert.equal((await request('/admin/dashboard.html',undefined,admin.cookie)).status,200);
  assert.equal((await request('/api/admins',undefined,admin.cookie)).data.length,1);
  const service=await request('/api/servicos',{nome_servico:'Serviço registrado',preco_base:95},admin.cookie);assert.equal(service.status,201);
  const order={id_servico:service.data.id,data:'2099-11-09',local:'Endereço do cliente',descricao:'Manutenção solicitada',id_cliente:other.data.id,id_funcionario:staff.data.usuario.id,preco_unitario:0};
  assert.equal((await request('/api/solicitacoes',order,staff.cookie)).status,403);
  assert.equal((await request('/api/solicitacoes',{...order,data:'2099-02-30'},client.cookie)).status,400);
  const result=await request('/api/solicitacoes',order,client.cookie);assert.equal(result.status,201);
  const mine=(await request('/api/os?perfil=cliente&id='+other.data.id,undefined,client.cookie)).data;
  assert.equal(mine.length,1);assert.equal(mine[0].id_cliente,client.data.usuario.id);assert.equal(mine[0].id_funcionario,null);assert.equal(mine[0].preco_unitario,95);
  const otherLogin=await login('cliente','outra@example.test');assert.deepEqual((await request('/api/os',undefined,otherLogin.cookie)).data,[]);
  assert.equal((await request('/api/os',undefined,staff.cookie)).data.length,1);
  assert.equal((await request('/api/os/'+result.data.id+'/aceitar',{},client.cookie)).status,403);
  const outcomes=await Promise.all([staff,staff2].map(p=>request('/api/os/'+result.data.id+'/aceitar',{},p.cookie)));
  assert.deepEqual(outcomes.map(r=>r.status).sort(),[200,409]);
  const winner=outcomes.findIndex(r=>r.status===200),people=[staff,staff2];
  assert.equal((await request('/api/os',undefined,people[1-winner].cookie)).data.length,0);
  assert.equal((await request('/api/os',undefined,client.cookie)).data[0].id_funcionario,people[winner].data.usuario.id);
  assert.equal((await request('/api/logout',{},admin.cookie)).status,200);
  assert.equal((await request('/api/admins',undefined,admin.cookie)).status,401);
  assert.equal((await request('/admin/dashboard.html',undefined,admin.cookie)).status,302);
  assert.equal((await request('/api/login',{perfil:'admin',email:account.email,senha:'incorreta'})).status,401);
});
