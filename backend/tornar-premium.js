// Uso: node backend/tornar-premium.js seu@email.com
'use strict';
const db = require('./db');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: node backend/tornar-premium.js seu@email.com');
  process.exit(1);
}

(async () => {
  await db.ready;
  for (const tabela of ['cliente', 'funcionario']) {
    const resultado = await new Promise((resolve, reject) =>
      db.run(
        `UPDATE ${tabela} SET plano = 'premium' WHERE LOWER(TRIM(email)) = ?`,
        [email],
        function (erro) {
          if (erro) return reject(erro);
          resolve(this.changes);
        }
      )
    );
    if (resultado > 0) {
      console.log(`✅ Conta ${email} agora é premium na tabela ${tabela}.`);
      return db.close();
    }
  }
  console.log(`⚠️  Nenhuma conta encontrada com o e-mail ${email}.`);
  db.close();
})().catch(erro => {
  console.error('Erro:', erro.message);
  process.exit(1);
});