const pool = require('./db');

async function enregistrerErreur(clientId, type, message) {
  const resultat = await pool.query(
    `INSERT INTO erreurs_historique (client_id, type, message, statut)
     VALUES ($1, $2, $3, 'nouveau')
     RETURNING *`,
    [clientId, type, message]
  );
  return resultat.rows[0];
}

module.exports = { enregistrerErreur };