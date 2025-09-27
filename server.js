require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const nodemailer = require("nodemailer"); // REMOVED
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error en conexión MongoDB:", err));

// --- Schema for Player Predictions ---
const jugadaSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  paymentMethod: String,
  comments: String,
  worldSeriesMVP: String,
  tieBreakerScore: [Number],
  alWCWinners: [String], nlWCWinners: [String],
  alDSWinners: [String], nlDSWinners: [String],
  alCSWinner: String, nlCSWinner: String,
  worldSeriesWinner: String,
  seriesLengths: Object,
  submittedAt: { type: Date, default: Date.now }
});
const Jugada = mongoose.model("Jugada", jugadaSchema);

// --- Schema for the Correct Answers ---
const correctResultsSchema = new mongoose.Schema({
  singletonId: { type: String, default: "correct-results", unique: true },
  winners: Object,
  seriesLengths: Object,
  worldSeriesMVP: String,
});
const CorrectResult = mongoose.model("CorrectResult", correctResultsSchema);

// =============================================================
// --- Endpoint to POST a new prediction (SIMPLIFIED) ---
// =============================================================
app.post("/api/submit", async (req, res) => {
  const data = req.body;
  
  try {
    // Save prediction to MongoDB
    const newJugada = new Jugada(data);
    await newJugada.save();
    console.log("📥 Jugada guardada en la base de datos:", newJugada);

    // Only sending a success response, no email logic here.

    res.status(200).json({ message: "Predicción recibida correctamente y guardada." });
  } catch (error) {
    console.error("❌ Error en envío de predicción:", error);
    res.status(500).json({ error: "Error interno del servidor al guardar la predicción." });
  }
});
// =============================================================

// --- Endpoint to GET all player predictions ---
app.get("/api/jugadas", async (req, res) => {
  try {
    const allJugadas = await Jugada.find({}).sort({ submittedAt: -1 });
    res.status(200).json(allJugadas);
  } catch (error) {
    console.error("❌ Error al obtener las jugadas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- Secure Endpoint to SET the correct answers (Admin only) ---
app.post("/api/set-results", async (req, res) => {
  try {
    const providedKey = req.query.key;
    const secretKey = process.env.ADMIN_KEY;
    if (!secretKey || providedKey !== secretKey) {
      return res.status(401).json({ error: "Acceso no autorizado" });
    }
    
    await CorrectResult.findOneAndUpdate(
      { singletonId: "correct-results" },
      req.body,
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Resultados correctos guardados." });
  } catch (error) {
    console.error("❌ Error al guardar los resultados correctos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- Public Endpoint to GET the correct answers ---
app.get("/api/get-results", async (req, res) => {
    try {
        const results = await CorrectResult.findOne({ singletonId: "correct-results" });
        res.status(200).json(results || {});
    } catch (error) {
        console.error("❌ Error al obtener los resultados correctos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});