const { ajouterSignalement } = require('../models/signalementModel');
const { envoyerCourrielSaisieManuelle } = require('../services/courrielService'); // AJOUT

const CHAMPS_REQUIS = ['numero', 'rue', 'ville', 'codePostal', 'province'];

async function enregistrerSignalement(req, res) {
  const clientId = req.clientInfo.id;
  const corps = req.body || {};

  const champsManquants = CHAMPS_REQUIS.filter(champ => !corps[champ]);

  if (champsManquants.length > 0) {
    return res.status(400).json({
      statut: 'erreur',
      message: 'Champs manquants',
      champsManquants
    });
  }

   const adresse = {
    numero: corps.numero,
    rue: corps.rue,
    ville: corps.ville,
    codePostal: corps.codePostal,
    province: corps.province,
    pays: corps.pays || 'Canada',
    reference: corps.reference
};

  try {
    const ligne = await ajouterSignalement(clientId, adresse);

    // AJOUT : courriel immediat au responsable du site, sans attendre l'envoi
    envoyerCourrielSaisieManuelle(req.clientInfo.courriel_admin, req.clientInfo.nom_site, adresse)
     
      .catch(err => {
        console.error('Échec du courriel de saisie manuelle :', err.message);
      });

    res.status(201).json({
      statut: 'signalement_enregistre',
      message: 'Adresse transmise pour vérification',
      id: ligne.id
    });
  } catch (err) {
    console.error('Erreur lors de l\'ajout du signalement :', err.message);
    res.status(500).json({
      statut: 'erreur_technique',
      message: 'Impossible d\'enregistrer le signalement'
    });
  }
}

module.exports = { enregistrerSignalement };