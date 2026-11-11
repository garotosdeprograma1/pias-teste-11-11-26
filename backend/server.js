var http = require('http');
var fs = require('fs');
var path = require('path');
var db = require('./db');
var auth = require('./auth');

var PORTA = 5000;
var HOST = 'localhost';
const loginAttempts=new Map();

// ---------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------

function responderJson(res, status, conteudo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(conteudo));
}


    function validarCpf(cpf) {
      cpf = (cpf || "").replace(/\D/g, "");
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
      let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0;
      if (d1 !== parseInt(cpf[9])) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
      let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0;
      return d2 === parseInt(cpf[10]);
    }

function cadastrarConta(req, res, perfil) {
  var texto = '', tamanho = 0;
  req.on('data', function(chunk) { tamanho += chunk.length; if(tamanho <= 16384) texto += chunk; });
  req.on('end', function() {
    if(tamanho > 16384) return responderJson(res,413,{erro:'Dados muito longos.'});
    var novo;
    try { novo=JSON.parse(texto); } catch { return responderJson(res,400,{erro:'Dados inválidos.'}); }
    if(!novo || Array.isArray(novo) || !['nome','email','cpf','telefone','senha'].every(function(k){return typeof novo[k]==='string' && novo[k].trim();})) return responderJson(res,400,{erro:'Preencha nome, e-mail, CPF, telefone e senha.'});
    novo.nome=novo.nome.trim();novo.email=novo.email.trim().toLowerCase();novo.cpf=novo.cpf.replace(/\D/g,'');novo.telefone=novo.telefone.replace(/\D/g,'');
    if(novo.nome.length<3 || novo.nome.length>150 || novo.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo.email) || !validarCpf(novo.cpf) || ![10,11].includes(novo.telefone.length) || novo.senha.length<8 || novo.senha.length>128) return responderJson(res,400,{erro:'Confira nome, e-mail, CPF (11 dígitos), telefone e senha (8 a 128 caracteres).'});
    if(perfil==='funcionario' && (typeof novo.especialidade!=='string' || !novo.especialidade.trim())) return responderJson(res,400,{erro:'Informe sua especialidade.'});
    db.get('SELECT id FROM '+perfil+" WHERE LOWER(TRIM(email)) = ? OR REPLACE(REPLACE(cpf,'.',''),'-','') = ?",[novo.email,novo.cpf],function(erro,existente){
      if(erro) return responderJson(res,500,{erro:'Não foi possível verificar o cadastro.'});
      if(existente) return responderJson(res,409,{erro:'Já existe uma conta com este e-mail ou CPF neste perfil.'});
      var campos='nome,cpf,email,telefone,senha', valores=[novo.nome,novo.cpf,novo.email,novo.telefone,auth.hash(novo.senha)];
      if(perfil==='funcionario'){campos+=',especialidade';valores.push(novo.especialidade.trim());}
      db.run('INSERT INTO '+perfil+' ('+campos+') VALUES ('+valores.map(function(){return '?';}).join(',')+')',valores,function(erro){
        if(erro) return responderJson(res,erro.code==='SQLITE_CONSTRAINT'?409:500,{erro:erro.code==='SQLITE_CONSTRAINT'?'E-mail ou CPF já cadastrado.':'Não foi possível cadastrar a conta.'});
        responderJson(res,201,{id:this.lastID,nome:novo.nome,email:novo.email,telefone:novo.telefone,especialidade:perfil==='funcionario'?novo.especialidade.trim():undefined});
      });
    });
  });
}

var TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function servirArquivo(res, caminhoRelativo) {
  if (caminhoRelativo === '/') {
    caminhoRelativo = '/index.html';
  } else if (!path.extname(caminhoRelativo)) {
    caminhoRelativo = caminhoRelativo + '.html';
  }

  var caminho = path.join(path.resolve(__dirname, '../frontend'), caminhoRelativo);

  if (!caminho.startsWith(path.resolve(__dirname,'../frontend') + path.sep) || !fs.existsSync(caminho) || !fs.statSync(caminho).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Arquivo nao encontrado: ' + caminhoRelativo);
  }

  var tipo = TIPOS[path.extname(caminho)] || 'text/plain; charset=utf-8';
  res.writeHead(200, { 'Content-Type': tipo });
  res.end(fs.readFileSync(caminho));
}

// ---------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------

var servidor = http.createServer(async function (req, res) {
  try { await db.ready; } catch { return responderJson(res,503,{erro:'Banco de dados indisponível.'}); }
  let caminho;
  try { caminho = path.posix.normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { return responderJson(res,400,{erro:'Endereço inválido.'}); }
  if(caminho.includes('\\'))return responderJson(res,400,{erro:'Endereço inválido.'});
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const session = auth.read(req);
  if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== 'http://' + req.headers.host && req.headers.origin !== 'https://' + req.headers.host) return responderJson(res,403,{erro:'Origem não permitida.'});
  if (caminho === '/api/session' && req.method === 'GET') return responderJson(res,session?200:401,session?{usuario:session.usuario,perfil:session.perfil}:{erro:'Entre novamente para continuar.'});
  if (caminho === '/api/logout' && req.method === 'POST') { auth.clear(req,res); return responderJson(res,200,{ok:true}); }
  if (caminho.toLowerCase() === '/admin' || caminho.toLowerCase().startsWith('/admin/')) {
    if (!session || session.perfil !== 'admin') { res.writeHead(302,{Location:'/admin-login.html'});return res.end(); }
  }
  const adminOnly = caminho === '/api/admins' ||
    (['/api/clientes','/api/funcionarios'].includes(caminho) && req.method === 'GET') ||
    (caminho.startsWith('/api/') && req.method === 'DELETE') ||
    (caminho === '/api/servicos' && req.method !== 'GET') ||
    (caminho === '/api/os' && req.method === 'POST');
  if (adminOnly && (!session || session.perfil !== 'admin')) return responderJson(res,session?403:401,{erro:'Acesso exclusivo da administração.'});
  if ((caminho === '/api/os' || caminho.startsWith('/api/os/') || caminho === '/api/solicitacoes') && !session) return responderJson(res,401,{erro:'Entre novamente para continuar.'});


  // Informações públicas sem dados de contato ou documentos dos usuários.
  if (req.method === 'GET' && caminho === '/api/profissionais') {
    db.all('SELECT id, nome, especialidade FROM funcionario ORDER BY nome', [], function (erro, linhas) {
      responderJson(res, erro ? 500 : 200, erro ? { erro: 'Não foi possível carregar os profissionais.' } : linhas);
    });
    return;
  }
  if (req.method === 'GET' && caminho === '/api/resumo') {
    db.get('SELECT (SELECT COUNT(*) FROM cliente) AS clientes, ' +
      '(SELECT COUNT(*) FROM funcionario) AS funcionarios, (SELECT COUNT(*) FROM servico) AS servicos, ' +
      '(SELECT COUNT(*) FROM os) AS pedidos', [], function (erro, linha) {
      responderJson(res, erro ? 500 : 200, erro ? { erro: 'Não foi possível carregar o resumo.' } : linha);
    });
    return;
  }

  // ---- autenticar cliente ou funcionario no SQLite ----
  if (req.method === 'POST' && caminho === '/api/login') {
    const ip=req.socket.remoteAddress;
    const now=Date.now();
    for(const [key,item] of loginAttempts)if(item.until<now)loginAttempts.delete(key);
    const attempt=loginAttempts.get(ip)||{count:0,until:now+15*60*1000};
    if(attempt.count>=30)return responderJson(res,429,{erro:'Muitas tentativas. Aguarde 15 minutos.'});
    attempt.count++;loginAttempts.set(ip,attempt);
    var textoLogin = '', tamanhoLogin = 0;

    req.on('data', function (pedaco) {
      tamanhoLogin += pedaco.length; if(tamanhoLogin <= 16384) textoLogin += pedaco;
    });

    req.on('end', function () {
      if(tamanhoLogin > 16384) return responderJson(res,413,{erro:'Dados muito longos.'});
      var credenciais;
      try {
        credenciais = JSON.parse(textoLogin);
      } catch (erro) {
        return responderJson(res, 400, { erro: 'Dados invalidos.' });
      }

      if (!credenciais ||
          !['cliente','funcionario','admin'].includes(credenciais.perfil) ||
          typeof credenciais.email !== 'string' || !credenciais.email.trim() ||
          typeof credenciais.senha !== 'string' || !credenciais.senha || credenciais.senha.length>128 || credenciais.email.length>254) {
        return responderJson(res, 400, { erro: 'Perfil, e-mail e senha sao obrigatorios.' });
      }

      // A tabela vem apenas dos perfis permitidos; valores usam parâmetros.
      var tabelaLogin = credenciais.perfil;
      var camposLogin = 'id, nome, email, telefone, senha' +
                        (tabelaLogin === 'funcionario' ? ', especialidade' : '');
      var sqlLogin = 'SELECT ' + camposLogin + ' FROM ' + tabelaLogin +
                    ' WHERE LOWER(TRIM(email)) = ? LIMIT 1';
      var valoresLogin = [credenciais.email.trim().toLowerCase()];

      db.get(sqlLogin, valoresLogin, function (erro, usuario) {
        if (erro) {
          return responderJson(res, 500, { erro: 'Nao foi possivel verificar o acesso. Tente novamente.' });
        }
        if (!usuario || credenciais.senha.length>128 || !auth.verify(credenciais.senha,usuario.senha)) {
          return responderJson(res, 401, { erro: 'E-mail ou senha invalidos para este perfil.' });
        }
        if (!usuario.senha.startsWith('scrypt$')) db.run('UPDATE '+tabelaLogin+' SET senha=? WHERE id=?',[auth.hash(credenciais.senha),usuario.id]);
        loginAttempts.delete(ip);
        delete usuario.senha;
        auth.start(req,res,usuario,credenciais.perfil);
        responderJson(res, 200, { usuario: usuario, perfil: credenciais.perfil });
      });
    });

    return;
  }

  // Contas administrativas usam o mesmo cadastro validado dos demais perfis.
  if (req.method === 'GET' && caminho === '/api/admins') {
    db.all('SELECT id, nome, email, telefone FROM admin ORDER BY id DESC', [], function(erro, linhas) {
      responderJson(res, erro ? 500 : 200, erro ? {erro:'Não foi possível carregar administradores.'} : linhas);
    });
    return;
  }
  if (req.method === 'POST' && caminho === '/api/admins') { cadastrarConta(req,res,'admin'); return; }

  // =================================================================
  // API: cliente
  // =================================================================

  // ---- listar ----
  if (req.method === 'GET' && caminho === '/api/clientes') {
    db.all('SELECT id, nome, cpf, email, telefone FROM cliente ORDER BY id DESC', [], function (erro, linhas) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      responderJson(res, 200, linhas);
    });
    return;
  }

  // ---- cadastrar ----
  if (req.method === 'POST' && caminho === '/api/clientes') { cadastrarConta(req,res,'cliente'); return; }

  // ---- excluir ----
  if (req.method === 'DELETE' && caminho.indexOf('/api/clientes/') === 0) {
    var idCliente = caminho.split('/')[3];

    db.run('DELETE FROM cliente WHERE id = ?', [idCliente], function (erro) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      if (this.changes === 0) {
        return responderJson(res, 404, { erro: 'Cliente nao encontrado.' });
      }
      console.log('Cliente excluido: id ' + idCliente);
      responderJson(res, 200, { removido: Number(idCliente) });
    });

    return;
  }

  // =================================================================
  // API: funcionario
  // =================================================================

  // ---- listar ----
  if (req.method === 'GET' && caminho === '/api/funcionarios') {
    db.all('SELECT id, nome, cpf, email, telefone, especialidade FROM funcionario ORDER BY id DESC', [], function (erro, linhas) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      responderJson(res, 200, linhas);
    });
    return;
  }

  // ---- cadastrar ----
  if (req.method === 'POST' && caminho === '/api/funcionarios') { cadastrarConta(req,res,'funcionario'); return; }

  // ---- excluir ----
  if (req.method === 'DELETE' && caminho.indexOf('/api/funcionarios/') === 0) {
    var idFunc = caminho.split('/')[3];

    db.run('DELETE FROM funcionario WHERE id = ?', [idFunc], function (erro) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      if (this.changes === 0) {
        return responderJson(res, 404, { erro: 'Funcionario nao encontrado.' });
      }
      console.log('Funcionario excluido: id ' + idFunc);
      responderJson(res, 200, { removido: Number(idFunc) });
    });

    return;
  }

  // =================================================================
  // API: servico
  // =================================================================

  // ---- listar ----
  if (req.method === 'GET' && caminho === '/api/servicos') {
    db.all('SELECT * FROM servico ORDER BY id DESC', [], function (erro, linhas) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      responderJson(res, 200, linhas);
    });
    return;
  }

  // ---- cadastrar ----
  if (req.method === 'POST' && caminho === '/api/servicos') {
    var textoServ = '';

    req.on('data', function (pedaco) {
      textoServ += pedaco;
    });

    req.on('end', function () {
      var novoServ;
      try {
        novoServ = JSON.parse(textoServ);
      } catch (erro) {
        return responderJson(res, 400, { erro: 'Dados invalidos.' });
      }

      if (!novoServ || typeof novoServ.nome_servico !== 'string' || !novoServ.nome_servico.trim() || novoServ.nome_servico.length > 150 || typeof novoServ.preco_base !== 'number' || !Number.isFinite(novoServ.preco_base) || novoServ.preco_base < 0 || (novoServ.descricao != null && (typeof novoServ.descricao !== 'string' || novoServ.descricao.length > 1000))) {
        return responderJson(res, 400, { erro: 'Nome_servico e preco_base sao obrigatorios.' });
      }

      var sqlServ = 'INSERT INTO servico (nome_servico, descricao, preco_base) VALUES (?, ?, ?)';
      var valoresServ = [novoServ.nome_servico, novoServ.descricao, novoServ.preco_base];

      db.run(sqlServ, valoresServ, function (erro) {
        if (erro) {
          return responderJson(res, 500, { erro: erro.message });
        }
        novoServ.id = this.lastID;
        console.log('Servico cadastrado: id ' + novoServ.id + ' - ' + novoServ.nome_servico);
        responderJson(res, 201, novoServ);
      });
    });

    return;
  }

  // ---- excluir ----
  if (req.method === 'DELETE' && caminho.indexOf('/api/servicos/') === 0) {
    var idServ = caminho.split('/')[3];

    db.run('DELETE FROM servico WHERE id = ?', [idServ], function (erro) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      if (this.changes === 0) {
        return responderJson(res, 404, { erro: 'Servico nao encontrado.' });
      }
      console.log('Servico excluido: id ' + idServ);
      responderJson(res, 200, { removido: Number(idServ) });
    });

    return;
  }

  // =================================================================
  // API: os (ordem de servico)
  // =================================================================

  // Solicitações do catálogo: o preço vem do banco, nunca do navegador.
  if (req.method === 'POST' && caminho === '/api/solicitacoes') {
    if(session.perfil !== 'cliente')return responderJson(res,403,{erro:'Somente clientes podem solicitar serviços.'});
    let body = '', size = 0;
    req.on('data', chunk => { size += chunk.length; if (size <= 16384) body += chunk; });
    req.on('end', () => {
      if (size > 16384) return responderJson(res, 413, {erro:'Solicitação muito longa.'});
      let order;
      try { order = JSON.parse(body); } catch { return responderJson(res,400,{erro:'Dados inválidos.'}); }
      if (!order || !Number.isSafeInteger(order.id_servico) || order.id_servico<1 ||
          typeof order.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(order.data) ||
          !['local','descricao'].every(key => typeof order[key]==='string' && order[key].trim().length>=3 && order[key].length<=1000)) {
        return responderJson(res,400,{erro:'Informe serviço, data, endereço e descrição válidos.'});
      }
      const date = new Date(order.data+'T12:00:00Z');
      const today = new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==order.data || order.data<today) return responderJson(res,400,{erro:'Escolha uma data válida a partir de hoje.'});
      db.get('SELECT preco_base FROM servico WHERE id=?',
        [order.id_servico], (error,row) => {
          if (error) return responderJson(res,500,{erro:'Não foi possível consultar os cadastros.'});
          if (!row) return responderJson(res,404,{erro:'Serviço não encontrado. Atualize a página.'});
          db.run('INSERT INTO os (id_cliente,id_servico,id_funcionario,preco_unitario,data,local,descricao) VALUES (?,?,?,?,?,?,?)',
            [session.usuario.id,order.id_servico,null,row.preco_base,order.data,order.local.trim(),order.descricao.trim()], function(error) {
              if(error) return responderJson(res,500,{erro:'Não foi possível registrar o pedido.'});
              responderJson(res,201,{id:this.lastID,preco_unitario:row.preco_base});
            });
        });
    });
    return;
  }

  if(req.method === 'POST' && /^\/api\/os\/\d+\/aceitar$/.test(caminho)) {
    if(session.perfil !== 'funcionario')return responderJson(res,403,{erro:'Somente profissionais podem aceitar pedidos.'});
    const id=Number(caminho.split('/')[3]);
    db.run('UPDATE os SET id_funcionario=? WHERE id=? AND id_funcionario IS NULL', [session.usuario.id,id], function(error) {
      if(error)return responderJson(res,500,{erro:'Não foi possível aceitar o pedido.'});
      if(!this.changes)return responderJson(res,409,{erro:'Este pedido já foi aceito ou não está mais disponível. Atualize a lista.'});
      responderJson(res,200,{id,id_funcionario:session.usuario.id});
    });return;
  }

  // ---- listar ----
  if (req.method === 'GET' && caminho === '/api/os') {
    var sqlListaOs = 'SELECT ' +
      'os.id, os.id_cliente, os.id_servico, os.id_funcionario, ' +
      'cliente.nome AS cliente, ' +
      'servico.nome_servico AS servico, ' +
      'funcionario.nome AS funcionario, ' +
      'os.preco_unitario, ' +
      'os.data, ' +
      'os.local, ' +
      'os.descricao ' +
      'FROM os ' +
      'INNER JOIN cliente ON os.id_cliente = cliente.id ' +
      'INNER JOIN servico ON os.id_servico = servico.id ' +
      'LEFT JOIN funcionario ON os.id_funcionario = funcionario.id ';

    var parametrosOs = [];
    if (session.perfil === 'cliente') {
      sqlListaOs += 'WHERE os.id_cliente = ? ';
      parametrosOs.push(session.usuario.id);
    } else if (session.perfil === 'funcionario') {
      sqlListaOs += 'WHERE os.id_funcionario = ? OR os.id_funcionario IS NULL ';
      parametrosOs.push(session.usuario.id);
    }
    sqlListaOs += 'ORDER BY os.id DESC';

    db.all(sqlListaOs, parametrosOs, function (erro, linhas) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      responderJson(res, 200, linhas);
    });
    return;
  }

  // ---- cadastrar ----
  if (req.method === 'POST' && caminho === '/api/os') {
    var textoOs = '';

    req.on('data', function (pedaco) {
      textoOs += pedaco;
    });

    req.on('end', function () {
      var novaOs;
      try {
        novaOs = JSON.parse(textoOs);
      } catch (erro) {
        return responderJson(res, 400, { erro: 'Dados invalidos.' });
      }

      if (!novaOs.id_cliente || !novaOs.id_servico || !novaOs.id_funcionario ||
          novaOs.preco_unitario === undefined || !novaOs.data || !novaOs.local || !novaOs.descricao) {
        return responderJson(res, 400, {
          erro: 'id_cliente, id_servico, id_funcionario, preco_unitario, data, local e descricao sao obrigatorios.'
        });
      }

      var sqlOs = 'INSERT INTO os (id_cliente, id_servico, id_funcionario, preco_unitario, data, local, descricao) ' +
                  'VALUES (?, ?, ?, ?, ?, ?, ?)';
      var valoresOs = [novaOs.id_cliente, novaOs.id_servico, novaOs.id_funcionario,
                       novaOs.preco_unitario, novaOs.data, novaOs.local, novaOs.descricao];

      db.run(sqlOs, valoresOs, function (erro) {
        if (erro) {
          return responderJson(res, 500, { erro: erro.message });
        }
        novaOs.id = this.lastID;
        console.log('OS cadastrada: id ' + novaOs.id);
        responderJson(res, 201, novaOs);
      });
    });

    return;
  }

  // ---- excluir ----
  if (req.method === 'DELETE' && caminho.indexOf('/api/os/') === 0) {
    var idOs = caminho.split('/')[3];

    db.run('DELETE FROM os WHERE id = ?', [idOs], function (erro) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      if (this.changes === 0) {
        return responderJson(res, 404, { erro: 'OS nao encontrada.' });
      }
      console.log('OS excluida: id ' + idOs);
      responderJson(res, 200, { removido: Number(idOs) });
    });

    return;
  }

  // ---- Arquivos da pasta frontend ----
  if (req.method === 'GET') {
    return servirArquivo(res, caminho === '/' ? '/' : caminho);
  }

  responderJson(res, 404, { erro: 'Nao encontrado.' });
});

servidor.on('error', function (erro) {
  if (erro.code === 'EADDRINUSE') {
    console.log('');
    console.log('A porta ' + PORTA + ' ja esta sendo usada.');
    console.log('Feche a outra janela do terminal e tente de novo.');
    return;
  }
  console.log('Erro: ' + erro.message);
});

servidor.listen(PORTA, HOST, function () {
  console.log('');
  console.log('  Pronto! Gravando em banco.db (SQLite).');
  console.log('');
  console.log('      http://' + HOST + ':' + PORTA);
  console.log('');
  console.log('  Para desligar, aperte Ctrl+C aqui nesta janela.');
  console.log('');
});
