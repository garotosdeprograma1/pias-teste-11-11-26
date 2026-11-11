var sqlite3 = require('sqlite3');
var path = require('path');

var caminho = path.join(__dirname, 'banco.db');
var db = new sqlite3.Database(caminho);

db.serialize(function () {

  // Faz o SQLite validar as chaves estrangeiras.
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL, cpf TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE, telefone TEXT NOT NULL, senha TEXT NOT NULL
  )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS cliente (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      nome     TEXT NOT NULL,
      cpf      TEXT NOT NULL UNIQUE,
      email    TEXT NOT NULL UNIQUE,
      telefone TEXT NOT NULL,
      senha    TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS funcionario (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      cpf           TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      telefone      TEXT NOT NULL,
      senha         TEXT NOT NULL,
      especialidade TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS servico (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_servico TEXT NOT NULL,
      descricao    TEXT,
      preco_base   REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS os (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cliente     INTEGER NOT NULL,
      id_servico     INTEGER NOT NULL,
      id_funcionario INTEGER,
      preco_unitario REAL NOT NULL,
      data           TEXT NOT NULL,
      local          TEXT NOT NULL,
      descricao      TEXT NOT NULL,

      FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
      FOREIGN KEY (id_servico) REFERENCES servico(id),
      FOREIGN KEY (id_funcionario) REFERENCES funcionario(id)
    )
  `);
});

// Migração preserva pedidos antigos e permite solicitações ainda sem profissional.
db.ready = new Promise((resolve, reject) => {
  db.all('PRAGMA table_info(os)', [], (error, columns) => {
    if (error) return reject(error);
    if (!columns.find(c => c.name === 'id_funcionario' && c.notnull)) return resolve();
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE os_pending (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
        id_servico INTEGER NOT NULL REFERENCES servico(id),
        id_funcionario INTEGER REFERENCES funcionario(id),
        preco_unitario REAL NOT NULL, data TEXT NOT NULL,
        local TEXT NOT NULL, descricao TEXT NOT NULL
      );
      INSERT INTO os_pending SELECT * FROM os;
      DROP TABLE os;
      ALTER TABLE os_pending RENAME TO os;
      COMMIT;`, error => {
        if (error) return db.exec('ROLLBACK', () => reject(error));
        resolve();
      });
  });
});
module.exports = db;