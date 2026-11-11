'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const sqlite=require('../backend/node_modules/sqlite3');
test('pending-order migration preserves existing assignments and allows unassigned requests',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'dafix-migration-'));
  let db=new sqlite.Database(path.join(directory,'banco.db'));
  try {
    await new Promise((resolve,reject)=>db.exec(`
      CREATE TABLE cliente(id INTEGER PRIMARY KEY,nome TEXT,cpf TEXT,email TEXT,telefone TEXT,senha TEXT);
      CREATE TABLE funcionario(id INTEGER PRIMARY KEY,nome TEXT,cpf TEXT,email TEXT,telefone TEXT,senha TEXT,especialidade TEXT);
      CREATE TABLE servico(id INTEGER PRIMARY KEY,nome_servico TEXT,descricao TEXT,preco_base REAL);
      CREATE TABLE os(id INTEGER PRIMARY KEY AUTOINCREMENT,id_cliente INTEGER NOT NULL,id_servico INTEGER NOT NULL,id_funcionario INTEGER NOT NULL,preco_unitario REAL NOT NULL,data TEXT NOT NULL,local TEXT NOT NULL,descricao TEXT NOT NULL);
      INSERT INTO cliente VALUES(1,'Cliente de teste','52998224725','teste@example.test','11999999999','teste');
      INSERT INTO funcionario VALUES(2,'Profissional de teste','11144477735','equipe@example.test','11999999999','teste','Instalações');
      INSERT INTO servico VALUES(3,'Serviço de teste','Descrição',95);
      INSERT INTO os VALUES(7,1,3,2,95,'2099-11-09','Endereço de teste','Descrição do pedido');
    `,error=>error?reject(error):resolve()));
    await new Promise(resolve=>db.close(resolve));
    fs.copyFileSync(path.resolve(__dirname,'../backend/db.js'),path.join(directory,'db.js'));
    fs.symlinkSync(path.resolve(__dirname,'../backend/node_modules'),path.join(directory,'node_modules'));
    db=require(path.join(directory,'db.js'));await db.ready;
    const all=sql=>new Promise((resolve,reject)=>db.all(sql,[],(error,rows)=>error?reject(error):resolve(rows)));
    assert.deepEqual(await all('SELECT id,id_cliente,id_servico,id_funcionario,preco_unitario FROM os'),[{id:7,id_cliente:1,id_servico:3,id_funcionario:2,preco_unitario:95}]);
    await new Promise((resolve,reject)=>db.run("INSERT INTO os(id_cliente,id_servico,id_funcionario,preco_unitario,data,local,descricao) VALUES(1,3,NULL,95,'2099-11-10','Endereço','Descrição')",error=>error?reject(error):resolve()));
    assert.equal((await all('SELECT * FROM os WHERE id>7'))[0].id_funcionario,null);
    assert.deepEqual(await all('PRAGMA foreign_key_check'),[]);
  } finally {
    await new Promise(resolve=>db.close(resolve));fs.rmSync(directory,{recursive:true,force:true});
  }
});
