const express = require('express');
const router = express.Router();
const verifierCleApi = require('../middlewares/auth');
const { validerAdresse } = require('../controllers/erreursController');
const { enregistrerSignalement } = require('../controllers/signalementController');
const { declencherResume } = require('../controllers/resumeController');
const limiteurParCle = require('../middlewares/rateLimiter'); 

router.post('/valider-adresse', verifierCleApi, limiteurParCle, validerAdresse);
router.post('/signalement', verifierCleApi, limiteurParCle, enregistrerSignalement);
router.post('/resume', declencherResume); // AJOUT : protegee par la cle admin

module.exports = router;