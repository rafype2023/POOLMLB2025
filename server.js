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

// --- Updated Database Schema ---
const predictionSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  paymentMethod: String,
  comments: String,
  worldSeriesMVP: String,
  alWCWinners: [String],
  nlWCWinners: [String],
  alDSWinners: [String],
  nlDSWinners: [String],
  alCSWinner: String,
  nlCSWinner: String,
  worldSeriesWinner: String,
  seriesLengths: Object, // <-- UPDATED FIELD
  submittedAt: { type: Date, default: Date.now }
});

const Prediction = mongoose.model("Prediction", predictionSchema);

app.post("/api/submit", async (req, res) => {
  try {
    const data = req.body;

    const newPrediction = new Prediction({
      name: data.name,
      email: data.email,
      phone: data.phone,
      paymentMethod: data.paymentMethod,
      comments: data.comments || "N/A",
      worldSeriesMVP: data.worldSeriesMVP,
      alWCWinners: data.alWCWinners,
      nlWCWinners: data.nlWCWinners,
      alDSWinners: data.alDSWinners,
      nlDSWinners: data.nlDSWinners,
      alCSWinner: data.alCSWinner,
      nlCSWinner: data.nlCSWinner,
      worldSeriesWinner: data.worldSeriesWinner,
      seriesLengths: data.seriesLengths // <-- SAVING NEW DATA
    });

    await newPrediction.save();
    console.log("📥 Predicción guardada en la base de datos:", newPrediction);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // --- Updated Email Summary ---
    const summary = `
Resumen de tu Predicción MLB:

INFORMACIÓN:
- Nombre: ${data.name}
- Email: ${data.email}
- Teléfono: ${data.phone}
- Método de pago: ${data.paymentMethod}

GANADORES Y DURACIÓN DE SERIES:
- Wild Card AL: ${data.alWCWinners.join(" & ")} (En ${data.seriesLengths.al_wc1} y ${data.seriesLengths.al_wc2} juegos)
- Wild Card NL: ${data.nlWCWinners.join(" & ")} (En ${data.seriesLengths.nl_wc1} y ${data.seriesLengths.nl_wc2} juegos)
- Division Series AL: ${data.alDSWinners.join(" & ")} (En ${data.seriesLengths.al_ds1} y ${data.seriesLengths.al_ds2} juegos)
- Division Series NL: ${data.nlDSWinners.join(" & ")} (En ${data.seriesLengths.nl_ds1} y ${data.seriesLengths.nl_ds2} juegos)
- Campeón AL: ${data.alCSWinner} (En ${data.seriesLengths.al_cs} juegos)
- Campeón NL: ${data.nlCSWinner} (En ${data.seriesLengths.nl_cs} juegos)

PREDICCIÓN FINAL:
- Campeón Serie Mundial: ${data.worldSeriesWinner} (En ${data.seriesLengths.ws} juegos)
- MVP de la Serie Mundial: ${data.worldSeriesMVP}

¡Gracias por participar y mucha suerte!
    `;

    await transporter.sendMail({
      from: `"MLB Playoff Pool" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: "Confirmación de tu predicción MLB",
      text: summary
    });

    res.status(200).json({ message: "Predicción recibida correctamente" });
  } catch (error) {
    console.error("❌ Error en envío de predicción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
