const pool = require('../models/db');

async function verifierCleApi(req, res, next) {
  const cleApi = req.headers['x-api-key'];

  if (!cleApi) {
    return res.status(401).json({ erreur: 'Clé API manquante' });
  }

  try {
       const resultat = await pool.query(
      'SELECT id, nom_site, courriel_admin FROM clients_api WHERE cle_api = $1',
      [cleApi]
    );

    if (resultat.rows.length === 0) {
      return res.status(401).json({ erreur: 'Clé API invalide' });
    }

    req.clientInfo = resultat.rows[0];
    next();
  } catch (err) {
    console.error('Erreur lors de la vérification de la clé API :', err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
}

module.exports = verifierCleApi;