require('dotenv').config();
console.log('USER:', `[${process.env.SMTP_USER}]`, 'PASS longueur:', process.env.SMTP_PASS.length);
const { envoyerCourrielErreurTechnique } = require('./src/services/courrielService');

envoyerCourrielErreurTechnique('admin@test.com', 'Site de test', 'Ceci est un courriel de test')
  .then(() => console.log('Courriel envoyé'))
  .catch(err => console.error('Échec :', err.message));