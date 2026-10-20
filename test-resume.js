require('dotenv').config();
const { envoyerResumes } = require('./src/services/resumeService');

envoyerResumes()
  .then(bilan => {
    console.log('Bilan :', bilan);
    process.exit(0);
  })
  .catch(err => {
    console.error('Échec :', err.message);
    process.exit(1);
  });