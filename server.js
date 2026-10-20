require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const { demarrerPlanificateur } = require("./src/jobs/planificateur");

// CORS : seules les origines du .env peuvent appeler l'API depuis un navigateur
const originesAutorisees = (process.env.ORIGINES_AUTORISEES || "")
  .split(",")
  .map((origine) => origine.trim())
  .filter((origine) => origine !== "");

// CSP : la page de saisie ne peut être affichée que par les sites autorisés
const politiqueCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "frame-ancestors " +
    (originesAutorisees.length > 0 ? originesAutorisees.join(" ") : "'none'"),
].join("; ");

app.use(
  cors({
    origin: originesAutorisees,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
  }),
);
app.use(express.json());
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("saisieAdresse.html")) {
        res.setHeader("Content-Security-Policy", politiqueCsp);
      }
    },
  }),
);

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("API de capture d'erreurs — serveur actif");
});

const routesErreurs = require("./src/routes/erreurs");
app.use("/api", routesErreurs);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  demarrerPlanificateur();
});
