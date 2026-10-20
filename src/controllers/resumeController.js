const { envoyerResumes } = require('../services/resumeService');

async function declencherResume(req, res) {
  const cleAdmin = process.env.ADMIN_KEY;

  // Refus si la cle n'est pas configuree, absente ou incorrecte
  if (!cleAdmin || req.get('X-Admin-Key') !== cleAdmin) {
    return res.status(401).json({
      statut: 'erreur',
      message: 'Clé administrateur invalide'
    });
  }

  try {
    const bilan = await envoyerResumes();
    res.json({ statut: 'resume_envoye', ...bilan });
  } catch (err) {
    console.error('Erreur lors du résumé :', err.message);
    res.status(500).json({
      statut: 'erreur_technique',
      message: 'Impossible de générer le résumé'
    });
  }
}

module.exports = { declencherResume };