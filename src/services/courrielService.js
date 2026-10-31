const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Traduit un message technique en explication simple pour un administrateur non informaticien
function diagnosticSimple(message) {
  const m = String(message).toLowerCase();

  if (m.includes('apikey') || m.includes('api key') || m.includes('401') || m.includes('403')) {
    return {
      cause: "La clé qui donne accès au service de recherche d'adresses est refusée (invalide, expirée ou désactivée).",
      action: "Vérifier la clé du service de géolocalisation dans la configuration de l'API, puis la remplacer au besoin."
    };
  }

  if (m.includes('429') || m.includes('limit') || m.includes('quota')) {
    return {
      cause: "Le service de recherche d'adresses a reçu trop de demandes et refuse d'en traiter d'autres pour le moment.",
      action: "Attendre quelques minutes. Si le problème revient souvent, vérifier le forfait du service de géolocalisation."
    };
  }

  if (m.includes('enotfound') || m.includes('econnrefused') || m.includes('econnreset')
      || m.includes('etimedout') || m.includes('timeout')) {
    return {
      cause: "L'API n'arrive pas à joindre le service de recherche d'adresses (problème de connexion Internet ou service hors ligne).",
      action: "Vérifier la connexion Internet du serveur de l'API, puis réessayer plus tard."
    };
  }

  return {
    cause: "Le service de recherche d'adresses a répondu de façon inattendue.",
    action: "Transmettre ce courriel au développeur, qui trouvera le détail technique plus bas."
  };
}

async function envoyerCourrielErreurTechnique(destinataire, nomSite, message) {
  const diag = diagnosticSimple(message);

  const info = await transporter.sendMail({
    from: `"API Capture Erreurs" <${process.env.SMTP_USER}>`,
    to: destinataire,
    subject: `[Erreur technique] ${nomSite}`,
    text: `Bonjour,\n\n`
        + `Un problème technique empêche la vérification des adresses sur le site ${nomSite}.\n\n`
        + `Ce qui s'est passé : ${diag.cause}\n`
        + `Ce qu'il faut faire : ${diag.action}\n\n`
        + `Vos clients ne sont pas bloqués : leurs formulaires continuent de fonctionner, `
        + `mais les adresses ne sont pas vérifiées tant que le problème dure.\n\n`
        + `Détail technique (pour le développeur) : ${message}\n\n`
        + `Date : ${new Date().toLocaleString('fr-CA')}`
  });
  return info;
}

async function envoyerResumeSignalements(destinataire, nomSite, signalements) {

  // Une ligne par signalement (saisie manuelle ou à vérifier), numérotée

  const lignes = signalements.map((s, i) => {
    const a = s.adresse_saisie;
    const date = new Date(s.date_ajout).toLocaleString('fr-CA');
        const etiquette = a.type === 'a_verifier'
        ? `[À vérifier : l'adresse tapée n'est peut-être pas exacte, le niveau de fiabilité de l'adresse est de ${Math.round(a.confiance * 100)} % (adresse tapée : « ${a.saisie} »)]`
      : '[Saisie manuelle]';
    return `${i + 1}. ${etiquette} ${a.numero ?? '?'} ${a.rue ?? '?'}, ${a.ville ?? '?'}`
         + ` (${a.province ?? '?'}) ${a.codePostal ?? '?'} - reçue le ${date}`
         + (a.reference ? ` - référence : ${a.reference}` : '');
  }).join('\n');

  const nbAVerifier = signalements.filter(s => s.adresse_saisie.type === 'a_verifier').length;
  const nbManuelles = signalements.length - nbAVerifier;

  const info = await transporter.sendMail({
    from: `"API Capture Erreurs" <${process.env.SMTP_USER}>`,
    to: destinataire,
    subject: `[Résumé] ${signalements.length} adresse(s) à vérifier - ${nomSite}`,
    text: `Bonjour,\n\n`
        + `Les adresses suivantes du site ${nomSite} demandent une vérification :\n`
        + `- ${nbManuelles} [Saisie manuelle] : introuvables automatiquement, entrées par le client lui-même;\n`
        + `- ${nbAVerifier} [À vérifier] : trouvées automatiquement, mais avec une confiance moyenne.\n\n`
        + `Veuillez les vérifier auprès des clients concernés.\n\n`
        + `${lignes}\n\n`
        + `Résumé généré le ${new Date().toLocaleString('fr-CA')}`
  });
  return info;
}

// Courriel immediat a chaque adresse saisie a la main dans l'iframe
// Courriel immediat a chaque adresse saisie a la main dans l'iframe
async function envoyerCourrielSaisieManuelle(destinataire, nomSite, adresse) {
  const info = await transporter.sendMail({
    from: `"API Capture Erreurs" <${process.env.SMTP_USER}>`,
    to: destinataire,
    subject: `[Saisie manuelle] Adresse à vérifier - ${nomSite}`,
    text: `Bonjour,\n\n`
        + `Un client du site ${nomSite} vient de saisir son adresse à la main, `
        + `car elle n'a pas pu être trouvée automatiquement :\n\n`
        + `${adresse.numero} ${adresse.rue}, ${adresse.ville} (${adresse.province}) ${adresse.codePostal}, ${adresse.pays}\n\n`
        + (adresse.reference ? `Référence du formulaire : ${adresse.reference}\n\n` : '')
        + `Nous vous invitons à vérifier cette adresse auprès du client `
        + `(nom, téléphone, courriel) avant de l'utiliser.\n\n`
        + `Cette adresse figurera aussi dans le résumé quotidien de 8 h.\n\n`
        + `Reçue le ${new Date().toLocaleString('fr-CA')}`
  });
  return info;
}

module.exports = { envoyerCourrielErreurTechnique, envoyerResumeSignalements, envoyerCourrielSaisieManuelle };