const { rcedit } = require('rcedit');
const path = require('path');

const exe = path.join(__dirname, 'dist', 'win-unpacked', 'Facho.exe');
const ico = path.join(__dirname, 'build', 'icon.ico');

rcedit(exe, { icon: ico })
  .then(() => console.log('Ícone aplicado ao Facho.exe'))
  .catch(e => console.error('Erro ao aplicar ícone:', e.message));
