require('dotenv').config();
const { ajouterSignalement } = require('./src/models/signalementModel');

const adresseTest = {
  numero: '12',
  rue: 'rue Principale',
  ville: 'Amqui',
  codePostal: 'G5J 1A1',
  province: 'QC'
};

ajouterSignalement(1, adresseTest)
  .then(ligne => {
    console.log('Ligne ajoutée :', ligne);
    process.exit(0);
  })
  .catch(err => {
    console.error('Échec :', err.message);
    process.exit(1);
  });