const { obtenirSignalementsNonTraites, marquerSignalementsTraites } = require('../models/signalementModel');
const { envoyerResumeSignalements } = require('./courrielService');

async function envoyerResumes() {
  const signalements = await obtenirSignalementsNonTraites();

  // Rien a envoyer
  if (signalements.length === 0) {
    return { clientsEnvoyes: 0, signalementsTraites: 0, echecs: 0 };
  }

  // Regroupement des signalements par client
  const parClient = {};
  for (const s of signalements) {
    if (!parClient[s.client_id]) {
      parClient[s.client_id] = [];
    }
    parClient[s.client_id].push(s);
  }

  let clientsEnvoyes = 0;
  let signalementsTraites = 0;
  let echecs = 0;

  // Un courriel par client, puis on marque ses signalements traites
  for (const clientId in parClient) {
    const groupe = parClient[clientId];

    try {
      await envoyerResumeSignalements(groupe[0].courriel_admin, groupe[0].nom_site, groupe);
      // Atteint seulement si l'envoi a reussi
      await marquerSignalementsTraites(groupe.map(s => s.id));
      clientsEnvoyes++;
      signalementsTraites += groupe.length;
    } catch (err) {
      // Les signalements de ce client restent en attente pour le prochain resume
      console.error(`Échec du résumé pour le client ${clientId} :`, err.message);
      echecs++;
    }
  }

  return { clientsEnvoyes, signalementsTraites, echecs };
}

module.exports = { envoyerResumes };