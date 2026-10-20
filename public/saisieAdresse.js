const params = new URLSearchParams(window.location.search);
const origineParent = params.get('origine');
const cleApi = params.get('cle');   // AJOUT : cle API du site client
const reference = params.get('reference');
const formAdresse = document.getElementById('formAdresse');
const boutonConfirmer = formAdresse.querySelector('button[type="submit"]');
const messageErreur = document.getElementById('messageErreur');

formAdresse.addEventListener('submit', async (event) => {
  event.preventDefault();
  messageErreur.hidden = true;

  if (!formAdresse.checkValidity()) {
    formAdresse.reportValidity();
    return;
  }

  if (!origineParent || !cleApi) {
    console.error('Paramètre manquant dans l\'adresse de la page (?origine=...&cle=...)');
    return;
  }

  const adresse = {
    numero: document.getElementById('numero').value.trim(),
    rue: document.getElementById('rue').value.trim(),
    ville: document.getElementById('ville').value.trim(),
    province: document.getElementById('province').value,
    codePostal: document.getElementById('codePostal').value.trim().toUpperCase(),
    pays: document.getElementById('pays').value.trim(),
    reference
};

  // Empeche un double clic d'envoyer deux signalements
  boutonConfirmer.disabled = true;

  try {
    // Meme origine que la page : pas de CORS
    const reponse = await fetch('/api/signalement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': cleApi
      },
      body: JSON.stringify(adresse)
    });

    // fetch ne lance pas d'erreur pour un 400 ou un 500 : on verifie nous-memes
    if (!reponse.ok) {
      throw new Error(`Réponse du serveur : ${reponse.status}`);
    }

    // Enregistrement reussi : on renvoie l'adresse au site client
    window.parent.postMessage({ type: 'adresseConfirmee', adresse }, origineParent);
    console.log('Adresse enregistrée et envoyée à', origineParent, adresse);

  } catch (err) {
    console.error('Échec de l\'enregistrement de l\'adresse :', err.message);
    messageErreur.textContent = 'Votre adresse n\'a pas pu être enregistrée. Veuillez réessayer dans un instant.';
    messageErreur.hidden = false;
    boutonConfirmer.disabled = false;   // permet de reessayer
  }
});