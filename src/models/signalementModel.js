const pool = require('./db');

async function ajouterSignalement(clientId, adresse) {
  const resultat = await pool.query(
    `INSERT INTO file_signalement (client_id, adresse_saisie, date_ajout, traite)
     VALUES ($1, $2, NOW(), false)
     RETURNING *`,
    [clientId, adresse]
  );
  return resultat.rows[0];
}


// Signalements en attente, avec le nom du site et le courriel de l'admin du client
async function obtenirSignalementsNonTraites() {
  const resultat = await pool.query(
    `SELECT s.id, s.client_id, s.adresse_saisie, s.date_ajout,
            c.nom_site, c.courriel_admin
     FROM file_signalement s
     JOIN clients_api c ON c.id = s.client_id
     WHERE s.traite = false
     ORDER BY s.client_id, s.date_ajout`
  );
  return resultat.rows;
}

// Marque comme traites seulement les signalements dont l'id est dans la liste
async function marquerSignalementsTraites(ids) {
  await pool.query(
    `UPDATE file_signalement SET traite = true WHERE id = ANY($1)`,
    [ids]
  );
}

module.exports = { ajouterSignalement, obtenirSignalementsNonTraites, marquerSignalementsTraites };