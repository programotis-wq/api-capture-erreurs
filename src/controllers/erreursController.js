const { validerAdresseGeoapify, traduireVerdict } = require('../services/geoapifyService');
const { envoyerCourrielErreurTechnique } = require('../services/courrielService');
const { enregistrerErreur } = require('../models/erreursModel');
const { ajouterSignalement } = require('../models/signalementModel');

// Panne du service : journalisation, courriel immédiat (sans attendre), réponse 500.
// Appelée par les deux chemins de panne : verdict « panne » et exception.
async function gererPanne(req, res, clientId, message) {
  console.error('Erreur technique lors de la validation d\'adresse :', message);
  await enregistrerErreur(clientId, 'technique', message);

  envoyerCourrielErreurTechnique(
    req.clientInfo.courriel_admin,
    req.clientInfo.nom_site,
    message
  ).catch(errCourriel => {
    console.error('Échec de l\'envoi du courriel :', errCourriel.message);
  });

  return res.status(500).json({
    statut: 'erreur_technique',
    message: 'Le service de géolocalisation est actuellement indisponible'
  });
}

async function validerAdresse(req, res) {
  const { adresse } = req.body;
  const clientId = req.clientInfo.id;

  if (!adresse) {
    return res.status(400).json({ erreur: 'Le champ adresse est requis' });
  }

  try {
    const resultat = await validerAdresseGeoapify(adresse);
        const { verdict, confiance, adresse: adresseTrouvee, message, composants } = traduireVerdict(resultat);

    switch (verdict) {
      case 'valide':
        return res.json({
          statut: 'succes',
          message: 'Adresse validée avec succès',
          adresseTrouvee,
          confiance
        });

      case 'a_verifier':
        await enregistrerErreur(clientId, 'a_verifier',
          `Adresse acceptée à vérifier (confiance ${confiance}) : ${adresse}`);
                  await ajouterSignalement(clientId, {
          type: 'a_verifier',
          ...composants,
          saisie: adresse,
          confiance
        });
        return res.json({
          statut: 'succes',
          aVerifier: true,
          message: 'Adresse acceptée, vérification recommandée',
          adresseTrouvee,
          confiance
        });

      case 'introuvable':
        await enregistrerErreur(clientId, 'validation', `Adresse introuvable : ${adresse}`);
        return res.json({
          statut: 'erreur_validation',
          message: 'Adresse introuvable — saisie manuelle requise'
        });

      case 'panne':
        return gererPanne(req, res, clientId, `Geoapify a retourné une erreur : ${message}`);
    }
  } catch (err) {
    // Geoapify ne répond pas du tout (réseau, délai dépassé...)
    return gererPanne(req, res, clientId, err.message);
  }
}

module.exports = { validerAdresse };