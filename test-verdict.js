require('dotenv').config();
const { traduireVerdict } = require('./src/services/geoapifyService');

const fausse = (confiance) => ({
  features: [{ properties: { formatted: 'Adresse test', rank: { confidence: confiance } } }]
});

console.log(traduireVerdict(fausse(0.95)));                        // valide
console.log(traduireVerdict(fausse(0.6)));                         // a_verifier
console.log(traduireVerdict(fausse(0.3)));                         // introuvable
console.log(traduireVerdict({ features: [] }));                    // introuvable
console.log(traduireVerdict({ statusCode: 401, error: 'Unauthorized', message: 'Invalid apiKey' }));  // panne