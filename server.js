require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer"); // Required
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

// ----------------------------------------
// --- NODEMAILER CONFIGURATION ---
// ----------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., 'smtp.gmail.com'
  port: process.env.SMTP_PORT, // e.g., 587 or 465
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER, // Your sending email
    pass: process.env.EMAIL_PASS, // Your App Password or service password
  },
});

// Optional: Verify the connection when the server starts
transporter.verify().then(() => {
  console.log('📧 Nodemailer Transporter Ready. Server can send emails.');
}).catch((error) => {
  console.error('❌ Nodemailer Transporter Error: Check SMTP settings and credentials:', error);
});


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

// -------------------------------------------------------------
// --- Endpoint to POST a new prediction (UPDATED WITH EMAIL) ---
// -------------------------------------------------------------
app.post("/api/submit", async (req, res) => {
  const data = req.body;
  const adminEmail = process.env.TO_EMAIL; // Admin receiving email from environment variables

  // 1. Create the HTML content for the Admin/Confirmation Email
  const emailHtml = `
    <h2>⚾ Nueva Predicción Recibida</h2>
    <p><strong>Nombre:</strong> ${data.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
    <p><strong>Teléfono:</strong> ${data.phone}</p>
    <p><strong>Método de Pago:</strong> ${data.paymentMethod}</p>
    <hr>
    <h3>Pronósticos del Jugador:</h3>
    <ul>
      <li><strong>Ganador de la Serie Mundial:</strong> ${data.worldSeriesWinner || 'N/A'}</li>
      <li><strong>MVP de la Serie Mundial:</strong> ${data.worldSeriesMVP || 'N/A'}</li>
      <li><strong>Ganador ALCS:</strong> ${data.alCSWinner || 'N/A'}</li>
      <li><strong>Ganador NLCS:</strong> ${data.nlCSWinner || 'N/A'}</li>
      <li><strong>Tie Breaker (Score):</strong> ${data.tieBreakerScore.join(' - ') || 'N/A'}</li>
      <li><strong>AL Wild Card:</strong> ${data.alWCWinners.join(', ') || 'N/A'}</li>
      <li><strong>NL Wild Card:</strong> ${data.nlWCWinners.join(', ') || 'N/A'}</li>
    </ul>
    <p><strong>Comentarios:</strong> ${data.comments || 'No hay comentarios.'}</p>
    <p><em>Enviado el: ${new Date().toLocaleString()}</em></p>
  `;

  try {
    // 2. Save prediction to MongoDB
    const newJugada = new Jugada(data);
    await newJugada.save();
    console.log("📥 Jugada guardada en la base de datos:", newJugada);

    // 3. Send Notification Email to Admin
    if (adminEmail && process.env.EMAIL_USER) {
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail, // The email that receives the notification
        subject: `⚾ Nueva Predicción de ${data.name}`,
        html: emailHtml,
      };
      const info = await transporter.sendMail(adminMailOptions);
      console.log("✅ Correo de notificación a Admin enviado:", info.messageId);

      // 4. Send Confirmation Email to User
      const confirmationMailOptions = {
        from: process.env.EMAIL_USER,
        to: data.email, // Send confirmation to the user's email
        subject: `✅ Confirmación de Predicción Recibida`,
        html: `Hola **${data.name}**,<br><br>Tu predicción para el World Series Challenge ha sido recibida y guardada correctamente. ¡Mucha suerte!<br><br>Saludos cordiales.`,
      };
      await transporter.sendMail(confirmationMailOptions);
    } else {
        console.warn('⚠️ No se pudo enviar el correo: Faltan variables de entorno (EMAIL_USER o TO_EMAIL).');
    }

    res.status(200).json({ message: "Predicción recibida y confirmación enviada." });
  } catch (error) {
    console.error("❌ Error en envío de predicción o correo:", error);
    // Note: It's often better to send a success response if the DB save worked, 
    // even if the email failed (unless the email is absolutely critical).
    res.status(500).json({ error: "Error interno del servidor. La predicción podría haberse guardado, pero el email falló." });
  }
});
// -------------------------------------------------------------
// -------------------------------------------------------------


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



