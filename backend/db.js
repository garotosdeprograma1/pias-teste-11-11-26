var sqlite3 = require('sqlite3');
var path = require('path');

var caminho = path.join(__dirname, 'banco.db');
var db = new sqlite3.Database(caminho);

db.serialize(function () {
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

  // ---------- Gamificação: Virtual Pet ----------
  db.run(`CREATE TABLE IF NOT EXISTS pet_item_def (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    slug           TEXT NOT NULL UNIQUE,
    tipo           TEXT NOT NULL CHECK(tipo IN ('comida','roupa','acessorio')),
    nome           TEXT NOT NULL,
    descricao      TEXT,
    raridade       TEXT NOT NULL DEFAULT 'comum' CHECK(raridade IN ('comum','rara','lendaria')),
    preco_moedas   INTEGER NOT NULL DEFAULT 0,
    premium_only   INTEGER NOT NULL DEFAULT 0,
    efeito_json    TEXT,
    xp_bonus       INTEGER NOT NULL DEFAULT 0,
    fome_reducao   INTEGER NOT NULL DEFAULT 0,
    felicidade_bonus INTEGER NOT NULL DEFAULT 0,
    sprite         TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pet (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_perfil        TEXT NOT NULL CHECK(user_perfil IN ('cliente','funcionario','admin')),
    user_id            INTEGER NOT NULL,
    nome               TEXT NOT NULL DEFAULT 'Bichinho',
    nivel              INTEGER NOT NULL DEFAULT 1,
    xp                 INTEGER NOT NULL DEFAULT 0,
    fome               INTEGER NOT NULL DEFAULT 50,
    felicidade         INTEGER NOT NULL DEFAULT 50,
    moedas             INTEGER NOT NULL DEFAULT 50,
    streak_atual       INTEGER NOT NULL DEFAULT 0,
    streak_record      INTEGER NOT NULL DEFAULT 0,
    ultimo_checkin     TEXT,
    ultima_atualizacao TEXT NOT NULL,
    congelamentos      INTEGER NOT NULL DEFAULT 0,
    criado_em          TEXT NOT NULL,
    UNIQUE(user_perfil, user_id)
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_pet_ranking
          ON pet(nivel DESC, streak_atual DESC, xp DESC)`);

  db.run(`CREATE TABLE IF NOT EXISTS pet_inventario (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id     INTEGER NOT NULL,
    item_id    INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(pet_id) REFERENCES pet(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES pet_item_def(id),
    UNIQUE(pet_id, item_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pet_equipado (
    pet_id  INTEGER NOT NULL,
    slot    TEXT NOT NULL CHECK(slot IN ('roupa','acessorio')),
    item_id INTEGER NOT NULL,
    PRIMARY KEY(pet_id, slot),
    FOREIGN KEY(pet_id) REFERENCES pet(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES pet_item_def(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pet_missao_def (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slug              TEXT NOT NULL UNIQUE,
    nome              TEXT NOT NULL,
    descricao         TEXT,
    tipo              TEXT NOT NULL CHECK(tipo IN ('diaria','premium')),
    recompensa_comida INTEGER NOT NULL DEFAULT 0,
    recompensa_moedas INTEGER NOT NULL DEFAULT 0,
    recompensa_xp     INTEGER NOT NULL DEFAULT 0,
    comida_item_slug  TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pet_missao_concluida (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id        INTEGER NOT NULL,
    missao_id     INTEGER NOT NULL,
    concluida_em  TEXT NOT NULL,
    FOREIGN KEY(pet_id) REFERENCES pet(id) ON DELETE CASCADE,
    FOREIGN KEY(missao_id) REFERENCES pet_missao_def(id),
    UNIQUE(pet_id, missao_id, concluida_em)
  )`);
});

// -------- Migrações idempotentes --------
function ensureColumn(table, column, ddl) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (error, columns) => {
      if (error) return reject(error);
      if (columns.some(c => c.name === column)) return resolve();
      db.run(`ALTER TABLE ${table} ADD COLUMN ${ddl}`, error => error ? reject(error) : resolve());
    });
  });
}

// Migração legada de OS (mantida do projeto original)
function migrateOsIdFuncionario() {
  return new Promise((resolve, reject) => {
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
}

db.ready = Promise.resolve()
  .then(migrateOsIdFuncionario)
  .then(() => ensureColumn('cliente',     'plano', "plano TEXT NOT NULL DEFAULT 'free'"))
  .then(() => ensureColumn('funcionario', 'plano', "plano TEXT NOT NULL DEFAULT 'free'"))
  .then(() => {
    // Seed é carregado após o schema existir (usa o próprio db).
    const seed = require('./pet/seed');
    return seed.run(db);
  });

module.exports = db;