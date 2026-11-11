/* Executado somente pelo responsável com acesso ao terminal do servidor. */
'use strict';
const db=require('./db');
const auth=require('./auth');
const email=(process.argv[2] || '').trim().toLowerCase();
(async()=>{
  await db.ready;
  if(!email)throw new Error('Uso: node backend/criar-admin.js email-da-sua-conta');
  const user=await new Promise((resolve,reject)=>db.get('SELECT * FROM cliente WHERE LOWER(TRIM(email))=?',[email],(error,row)=>error?reject(error):resolve(row)));
  if(!user)throw new Error('Cadastre primeiro sua conta de cliente com seus dados reais e execute novamente.');
  const password=user.senha.startsWith('scrypt$')?user.senha:auth.hash(user.senha);
  await new Promise((resolve,reject)=>db.run('INSERT INTO admin (nome,cpf,email,telefone,senha) VALUES (?,?,?,?,?)',[user.nome,user.cpf,user.email,user.telefone,password],error=>error?reject(new Error(error.code==='SQLITE_CONSTRAINT'?'Este administrador já existe.':'Não foi possível criar o administrador.')):resolve()));
  console.log('Administrador criado. Entre em /admin-login.html com o e-mail e a senha da sua conta.');
})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db.close());
