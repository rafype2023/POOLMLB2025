require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en conexión MongoDB:", err));

// --- Schema for Player Predictions ---
const jugadaSchema = new mongoose.Schema({ /* ... (no changes here) ... */ });
const Jugada = mongoose.model("Jugada", jugadaSchema);

// --- NEW: Schema for the Correct Answers ---
const correctResultsSchema = new mongoose.Schema({
  // Unique ID to ensure there's only one document for correct answers
  singletonId: { type: String, default: "correct-results", unique: true },
  worldSeriesWinner: String,
  worldSeriesMVP: String,
  seriesLengths: Object,
  alWCWinners: [String], nlWCWinners: [String],
  alDSWinners: [String], nlDSWinners: [String],
  alCSWinner: String, nlCSWinner: String,
});
const CorrectResult = mongoose.model("CorrectResult", correctResultsSchema);


// --- Endpoint to POST a new prediction ---
app.post("/api/submit", async (req, res) => { /* ... (no changes here) ... */ });

// --- Endpoint to GET all player predictions ---
app.get("/api/jugadas", async (req, res) => { /* ... (no changes here) ... */ });


// --- NEW: Secure Endpoint to SET the correct answers (Admin only) ---
app.post("/api/set-results", async (req, res) => {
  try {
    const providedKey = req.query.key;
    const secretKey = process.env.ADMIN_KEY;

    if (!secretKey || providedKey !== secretKey) {
      return res.status(401).json({ error: "Acceso no autorizado" });
    }
    
    // Find the existing results document or create a new one
    await CorrectResult.findOneAndUpdate(
      { singletonId: "correct-results" },
      req.body,
      { upsert: true, new: true } // upsert: true creates the document if it doesn't exist
    );

    res.status(200).json({ message: "Resultados correctos guardados." });
  } catch (error) {
    console.error("❌ Error al guardar los resultados correctos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- NEW: Public Endpoint to GET the correct answers ---
app.get("/api/get-results", async (req, res) => {
    try {
        const results = await CorrectResult.findOne({ singletonId: "correct-results" });
        res.status(200).json(results || {}); // Return results or an empty object
    } catch (error) {
        console.error("❌ Error al obtener los resultados correctos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
