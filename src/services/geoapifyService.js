
const https = require('https');

function validerAdresseGeoapify(adresse) {
  return new Promise((resolve, reject) => {
    const adresseEncodee = encodeURIComponent(adresse);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${adresseEncodee}&apiKey=${process.env.GEOAPIFY_API_KEY}`;

    https.get(url, (res) => {
      let donnees = '';

      res.on('data', (chunk) => {
        donnees += chunk;
      });

      res.on('end', () => {
        try {
          const resultat = JSON.parse(donnees);
          resolve(resultat);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Traduit la réponse brute de Geoapify en verdict commun,
// indépendant du fournisseur : valide | a_verifier | introuvable | panne
function traduireVerdict(donnees) {
  // 1. Réponse d'erreur de Geoapify (ex. clé invalide) → panne
  if (!donnees || donnees.statusCode || donnees.error) {
    return { verdict: 'panne', message: donnees?.message || 'Réponse invalide du service' };
  }

  // 2. Aucun résultat → introuvable
  const premier = donnees.features?.[0];
  if (!premier) {
    return { verdict: 'introuvable' };
  }

  // 3. On compare la confiance aux seuils du .env
  const confiance = premier.properties?.rank?.confidence ?? 0;
  const seuilValide = Number(process.env.SEUIL_VALIDE ?? 0.8);
  const seuilAVerifier = Number(process.env.SEUIL_A_VERIFIER ?? 0.5);

  let verdict;
  if (confiance >= seuilValide) {
    verdict = 'valide';
  } else if (confiance >= seuilAVerifier) {
    verdict = 'a_verifier';
  } else {
    verdict = 'introuvable';
  }

    const p = premier.properties;
  return {
    verdict,
    confiance,
    adresse: p.formatted,
    composants: {                       // même forme que les adresses saisies manuellement
      numero: p.housenumber,
      rue: p.street,
      ville: p.city,
      province: p.state_code,
      codePostal: p.postcode
    }
  };
}

module.exports = { validerAdresseGeoapify, traduireVerdict };