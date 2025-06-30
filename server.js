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

// --- Esquema para las Predicciones de Jugadores ---
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

// --- NUEVO y SIMPLIFICADO: Esquema para los Resultados Correctos ---
const correctResultsSchema = new mongoose.Schema({
  singletonId: { type: String, default: "correct-results", unique: true },
  winners: Object,      // Objeto simple: { 'al-wc1': 'Yankees', ... }
  seriesLengths: Object // Objeto simple: { 'al-wc1': 3, ... }
});
const CorrectResult = mongoose.model("CorrectResult", correctResultsSchema);

// --- Endpoint para ENVIAR una nueva predicción ---
app.post("/api/submit", async (req, res) => {
  // Sin cambios en esta sección
  try {
    const data = req.body;
    const newJugada = new Jugada(data);
    await newJugada.save();
    console.log("📥 Jugada guardada en la base de datos:", newJugada);
    // Lógica de Nodemailer...
    res.status(200).json({ message: "Predicción recibida correctamente" });
  } catch (error) {
    console.error("❌ Error en envío de predicción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- Endpoint para OBTENER todas las predicciones ---
app.get("/api/jugadas", async (req, res) => {
  try {
    const allJugadas = await Jugada.find({}).sort({ submittedAt: -1 });
    res.status(200).json(allJugadas);
  } catch (error) {
    console.error("❌ Error al obtener las jugadas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- Endpoint SEGURO para GUARDAR los resultados correctos (Admin) ---
app.post("/api/set-results", async (req, res) => {
  try {
    const providedKey = req.query.key;
    const secretKey = process.env.ADMIN_KEY;
    if (!secretKey || providedKey !== secretKey) {
      return res.status(401).json({ error: "Acceso no autorizado" });
    }
    
    // Usamos findOneAndUpdate con upsert:true para crear el documento si no existe.
    await CorrectResult.findOneAndUpdate(
      { singletonId: "correct-results" },
      req.body, // El cuerpo del request ahora coincide perfectamente con el schema
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Resultados correctos guardados." });
  } catch (error) {
    console.error("❌ Error al guardar los resultados correctos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- Endpoint PÚBLICO para OBTENER los resultados correctos ---
app.get("/api/get-results", async (req, res) => {
    try {
        const results = await CorrectResult.findOne({ singletonId: "correct-results" });
        res.status(200).json(results || {}); // Devuelve resultados o un objeto vacío
    } catch (error) {
        console.error("❌ Error al obtener los resultados correctos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
