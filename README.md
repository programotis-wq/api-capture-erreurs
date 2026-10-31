# API de capture d'erreurs

API REST qui valide les adresses saisies dans les formulaires d'un site web et capture les erreurs avec un diagnostic en français. Elle utilise le service Geoapify pour vérifier chaque adresse et enregistre les erreurs dans une base de données PostgreSQL.

Un widget JavaScript (`widget.js`) permet de brancher l'API sur un formulaire existant. Le projet a été testé avec un site démo de dépanneur, « Dépanneur du Lac ».

## Technologies utilisées

- Node.js et Express (serveur et routes de l'API)
- PostgreSQL (base de données, avec le module `pg`)
- Geoapify (validation des adresses)
- Nodemailer (courriels d'alerte)
- express-rate-limit (limitation du nombre de requêtes)
- dotenv (variables d'environnement)
- JavaScript natif pour le widget (`widget.js`)

## Fonctionnalités

- Authentification des sites clients par clé API (en-tête `X-API-Key`)
- Validation d'adresse avec Geoapify, avec un seuil de confiance et un verdict (valide, à vérifier, introuvable, panne)
- Journalisation des résultats et des erreurs dans PostgreSQL
- Diagnostic des erreurs en français dans les courriels d'alerte
- Courriel immédiat en cas d'échec, et résumé quotidien pour les adresses saisies manuellement
- Page de saisie manuelle de l'adresse, affichée dans un iframe quand la validation échoue
- Widget JavaScript (`widget.js`) qui s'intègre au formulaire du client
- Limitation à 30 requêtes par minute par clé API
- Politique de sécurité de contenu (CSP) qui limite l'iframe aux sites autorisés
- Référence anonyme (UUID) pour retrouver une adresse signalée sans conserver de renseignements personnels (Loi 25)

## Utilisation

Un site client s'identifie avec sa clé API, envoyée dans l'en-tête `X-API-Key`. Le formulaire du client envoie l'adresse à la route `POST /api/valider-adresse`.

L'API retourne un verdict pour chaque adresse : valide, à vérifier, introuvable ou panne. Quand la validation échoue, une page de saisie manuelle s'affiche dans un iframe, et l'adresse corrigée est renvoyée au formulaire. Une panne du service de validation génère un courriel d'alerte avec un diagnostic en français.

Le widget `widget.js` s'ajoute au formulaire du client et gère ces échanges automatiquement.

## Installation

Les fichiers nécessaires à l'installation et la procédure sont disponibles sur demande.

## Évolution

Le projet est en développement continu.

## Auteur

Sylvain Otis
Courriel : sylvainotis_11@hotmail.com
