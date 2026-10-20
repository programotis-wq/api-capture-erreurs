const cron = require('node-cron');
const { envoyerResumes } = require('../services/resumeService');

function demarrerPlanificateur() {
  // TEST : chaque minute. Pour la démo : '0 8 * * *' (tous les jours à 8 h)
  cron.schedule('0 8 * * *', async () => {
    console.log('[cron] Envoi des résumés...');
    try {
      const bilan = await envoyerResumes();
      console.log('[cron] Bilan :', bilan);
    } catch (err) {
      console.error('[cron] Erreur :', err.message);
    }
  });

  console.log('[cron] Planificateur démarré');
}

module.exports = { demarrerPlanificateur };