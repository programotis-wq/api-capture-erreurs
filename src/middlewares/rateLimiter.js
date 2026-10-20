const rateLimit = require('express-rate-limit');

const limiteurParCle = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req) => req.header('X-API-Key'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    statut: 'limite_atteinte',
    message: 'Trop de requêtes pour cette clé. Réessayez dans une minute.'
  }
});

module.exports = limiteurParCle;