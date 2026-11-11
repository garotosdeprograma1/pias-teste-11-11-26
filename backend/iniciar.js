/* Inicializador usado pelo iniciar.bat; abre o navegador após o servidor iniciar. */
'use strict';
const {spawn} = require('node:child_process');
const path = require('node:path');
const server = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
  stdio: ['inherit', 'pipe', 'inherit'],
});
let output = '', opened = false, failed = false;
server.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  output = (output + chunk).slice(-4096);
  if (output.includes('ja esta sendo usada.') || output.includes('Erro:')) failed = true;
  if (!opened && output.includes('Pronto! Gravando em banco.db')) {
    opened = true;
    const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', 'http://localhost:5000/'], {
      stdio: 'ignore', windowsHide: true,
    });
    browser.on('error', () => console.log('Abra http://localhost:5000/ no navegador.'));
    browser.unref();
  }
});
server.on('error', error => {
  console.error('Nao foi possivel iniciar o servidor:', error.message);
  process.exitCode = 1;
});
server.on('exit', code => { process.exitCode = failed ? 1 : (code || 0); });
process.on('SIGINT', () => { server.kill('SIGINT'); });
process.on('SIGTERM', () => { server.kill('SIGTERM'); });
