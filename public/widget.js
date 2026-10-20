// Widget de l'API de capture d'erreurs : a coller dans le site client
(function () {
  //------ Configuration lue dans la balise <script> ------//

  // Lue tout de suite : document.currentScript n'existe que pendant le chargement
  const script = document.currentScript;
  const cleApi = script.dataset.cle;
  const nomChamp = script.dataset.champ;

  // Champs separes du site client (facultatifs) : data-champ-ville, etc.
  const nomChampVille = script.dataset.champVille;
  const nomChampProvince = script.dataset.champProvince;
  const nomChampCodePostal = script.dataset.champCodePostal;

  // Adresse de l'API = origine d'ou le widget a ete charge
  const urlApi = new URL(script.src).origin;

  if (!cleApi || !nomChamp) {
    console.error(
      "[Capture erreurs] Les attributs data-cle et data-champ sont obligatoires sur la balise <script>.",
    );
    return;
  }

  //------ Etat du widget ------//

  let reference;                 // numero anonyme, cree a chaque envoi
  let laisserPasser = false;     // vrai seulement pendant le renvoi au site client
  let validationEnCours = false; // bloque le double clic
  let remiseFaite = false;       // vrai si l'evenement relance est bien passe

  //------ Champ d'adresse et formulaire du site client ------//

  const champ = document.querySelector(`[name="${nomChamp}"]`);
  if (!champ) {
    console.error(
      `[Capture erreurs] Aucun champ avec name="${nomChamp}" dans la page.`,
    );
    return;
  }

  // Le formulaire qui contient le champ d'adresse
  
  const formulaire = champ.form;
  if (!formulaire) {
    console.error(
      `[Capture erreurs] Le champ "${nomChamp}" n'est pas dans un <form>.`,
    );
    return;
  }

  //------ Champs separes (facultatifs) ------//

  // Cherche un champ dans le formulaire ; avertit si le nom donne n'existe pas
  function trouverChamp(nom) {
    if (!nom) return null;
    const element = formulaire.querySelector(`[name="${nom}"]`);
    if (!element) {
      console.warn(
        `[Capture erreurs] Aucun champ avec name="${nom}" dans le formulaire : ce champ est ignoré.`,
      );
    }
    return element;
  }

  const champVille = trouverChamp(nomChampVille);
  const champProvince = trouverChamp(nomChampProvince);
  const champCodePostal = trouverChamp(nomChampCodePostal);

  // Adresse complete envoyee a l'API : rue + ville + province + code postal
  function adresseComplete() {
    return [champ, champVille, champProvince, champCodePostal]
      .filter(Boolean)
      .map((element) => element.value.trim())
      .filter((valeur) => valeur !== "")
      .join(", ");
  }

  //------ Renvoi du formulaire au site client ------//

  function envoyerAuSite() {
    // Champ cache : new FormData(form) du site client le ramassera
    let champCache = formulaire.querySelector('input[name="reference"]');
    if (!champCache) {
      champCache = document.createElement("input");
      champCache.type = "hidden";
      champCache.name = "reference";
      formulaire.appendChild(champCache);
    }
    champCache.value = reference;

    validationEnCours = false;

    // Ajout 1 : frontiere visible entre le widget et le code du site client
    console.log(
      `[Capture erreurs] Remise du formulaire au site client (référence ${reference}). La suite dépend du code du site.`,
    );

    // requestSubmit declenche l'evenement submit : le code du site client s'execute
    remiseFaite = false;
    laisserPasser = true;
    formulaire.requestSubmit();
    laisserPasser = false;

    // Ajout 2 : le navigateur a refuse l'envoi (champ invalide)
    if (!remiseFaite) {
      console.warn(
        "[Capture erreurs] Le navigateur a refusé l'envoi : un champ du formulaire est invalide. Le formulaire n'a pas été remis au site client.",
      );
    }
  }

  //------ Iframe de saisie manuelle ------//

  function afficherIframe() {

    // Évite d'empiler plusieurs iframes si le client clique deux fois

    if (document.getElementById("capture-erreurs-iframe")) return;

    // Origine, cle et reference passees par l'URL : l'iframe n'a pas acces a nos variables
    const iframe = document.createElement("iframe");
    iframe.id = "capture-erreurs-iframe";
    iframe.src =
      `${urlApi}/saisieAdresse.html` +
      `?origine=${encodeURIComponent(window.location.origin)}` +
      `&cle=${encodeURIComponent(cleApi)}` +
      `&reference=${encodeURIComponent(reference)}`;
    iframe.style.width = "100%";
    iframe.style.height = "520px";
    iframe.style.border = "1px solid #ccc";

    // Affichee juste sous le formulaire
    formulaire.insertAdjacentElement("afterend", iframe);
  }

  //------ Retour de l'iframe (postMessage) ------//

  window.addEventListener("message", (event) => {
    // Seuls les messages venant de l'API sont acceptés
    if (event.origin !== urlApi) return;
    if (!event.data || event.data.type !== "adresseConfirmee") return;

    const a = event.data.adresse;

    // Chaque morceau va dans son champ s'il existe, sinon dans le champ principal
    const morceaux = [`${a.numero} ${a.rue}`];

    if (champVille) champVille.value = a.ville;
    else morceaux.push(a.ville);

    if (champProvince) {
      champProvince.value = a.province;
      // Un <select> refuse une valeur absente de ses options : on le signale
      if (champProvince.value !== a.province) {
        console.warn(
          `[Capture erreurs] La province "${a.province}" n'existe pas dans le champ "${nomChampProvince}" du site client.`,
        );
      }
    } else {
      morceaux.push(a.province);
    }

    if (champCodePostal) champCodePostal.value = a.codePostal;
    else morceaux.push(a.codePostal);

    champ.value = morceaux.join(", ");

    const iframe = document.getElementById("capture-erreurs-iframe");
    if (iframe) iframe.remove();

    console.log("[Capture erreurs] Adresse reçue de l'iframe :", adresseComplete());

    envoyerAuSite();
  });

  //------ Interception de l'envoi (phase de capture : avant le site client) ------//

  document.addEventListener(
    "submit",
    async (event) => {
      if (event.target !== formulaire) return; // autre formulaire de la page

      if (laisserPasser) {                     // renvoi du widget : on laisse passer
        remiseFaite = true;
        return;
      }

      if (!formulaire.checkValidity()) return; // le site client affiche ses erreurs

      // Bloque l'envoi ET le code du site client pendant la validation
      event.preventDefault();
      event.stopImmediatePropagation();

      if (validationEnCours) return;
      validationEnCours = true;

      reference = crypto.randomUUID();

      try {
        const reponse = await fetch(`${urlApi}/api/valider-adresse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": cleApi,
          },
          // Adresse complete : rue + ville + province + code postal
          body: JSON.stringify({ adresse: adresseComplete(), reference }),
        });

        // fetch ne lance pas d'erreur sur 4xx/5xx : on lit toujours le JSON
        const donnees = await reponse.json();
        console.log(
          "[Capture erreurs] Réponse de l'API :",
          reponse.status,
          donnees,
        );

        // Adresse introuvable : saisie manuelle dans l'iframe
        if (donnees.statut === "erreur_validation") {
          validationEnCours = false;
          afficherIframe();
          return;
        }

        // succes, panne ou toute autre réponse : on ne bloque pas le client
        envoyerAuSite();
      } catch (err) {
        // API injoignable : on ne bloque pas le client
        console.error(
          "[Capture erreurs] Appel à l'API impossible :",
          err.message,
        );
        envoyerAuSite();
      }
    },
    true, // phase de capture
  );
})();