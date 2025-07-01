document.addEventListener("DOMContentLoaded", function () {
  // --- 1. CONFIGURATION ---
  const alSeeds = ["New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins"];
  const nlSeeds = ["Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres"];
  const teamLogos = { /* ... (sin cambios) ... */ };
  const winners = {};
  const seriesLengths = {}; 

  // --- 2. DYNAMIC ELEMENT CREATION ---
  function getLengthOptions(maxGames) { /* ... (sin cambios) ... */ }
  function populateMatchup(wrapperId, selectId, team1, team2, maxGames) { /* ... (sin cambios) ... */ }
  function updateWorldSeriesCard() { /* ... (sin cambios) ... */ }
  function updateBracket() { /* ... (sin cambios) ... */ }
  function initializeBracket() { /* ... (sin cambios) ... */ }

  document.querySelector('.bracket').addEventListener('change', (e) => {
    const target = e.target;
    if (target.tagName === 'SELECT') {
      if (target.id.endsWith('-length')) {
        const seriesId = target.id.replace('-length', '');
        seriesLengths[seriesId] = target.value;
      } else {
        winners[target.id] = target.value;
        updateBracket();
      }
    }
  });
  
  // --- 5. VALIDATION & SUBMISSION ---
  function validateForm() { /* ... (sin cambios) ... */ return true; }

  // --- FUNCIÓN CORREGIDA ---
  function getFormSelections() {
    const getValue = id => (document.getElementById(id) || {}).value || "";
    
    // La corrección clave está aquí. Ahora pasamos el objeto seriesLengths
    // directamente, sin renombrar las claves.
    return {
      name: getValue("name"), email: getValue("email"), phone: getValue("phone"),
      paymentMethod: getValue("payment"), comments: getValue("comments"),
      worldSeriesMVP: getValue("mvp"),
      tieBreakerScore: [parseInt(getValue("tie-breaker-score1")) || 0, parseInt(getValue("tie-breaker-score2")) || 0],
      alWCWinners: [getValue("al-wc1"), getValue("al-wc2")],
      nlWCWinners: [getValue("nl-wc1"), getValue("nl-wc2")],
      alDSWinners: [getValue("al-ds1"), getValue("al-ds2")],
      nlDSWinners: [getValue("nl-ds1"), getValue("nl-ds2")],
      alCSWinner: getValue("al-cs"),
      nlCSWinner: getValue("nl-cs"),
      worldSeriesWinner: getValue("ws-winner"),
      seriesLengths: seriesLengths // <-- CORRECCIÓN
    };
  }

  document.getElementById("prediction-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateForm()) return;
    const data = getFormSelections();
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        alert("✅ ¡Predicción enviada con éxito! Revisa tu correo para la confirmación.");
        location.reload();
      } else { throw new Error(result.error || "Hubo un error al enviar tu predicción."); }
    } catch (err) {
      console.error("❌ Error al enviar:", err);
      alert("Error al enviar la predicción. Revisa la consola para más detalles.");
    }
  });

  initializeBracket();
});
