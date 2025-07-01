document.addEventListener("DOMContentLoaded", function () {
  // --- 1. CONFIGURACIÓN ---
  const alSeeds = ["New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins"];
  const nlSeeds = ["Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres"];
  
  const teamLogos = {
    "New York Yankees": "logos/yankees.png",
    "Baltimore Orioles": "logos/orioles.png",
    "Cleveland Guardians": "logos/guardians.png",
    "Seattle Mariners": "logos/mariners.png",
    "Houston Astros": "logos/astros.png",
    "Minnesota Twins": "logos/twins.png",
    "Los Angeles Dodgers": "logos/dodgers.png",
    "Milwaukee Brewers": "logos/brewers.png",
    "Philadelphia Phillies": "logos/phillies.png",
    "Atlanta Braves": "logos/braves.png",
    "Chicago Cubs": "logos/cubs.png",
    "San Diego Padres": "logos/padres.png",
    "TBD": "logos/default.png"
  };

  const winners = {};

  // --- 2. CREACIÓN DE ELEMENTOS DINÁMICOS ---

  function getLengthOptions(maxGames) {
    if (maxGames === 3) return `<option value="2">2</option><option value="3">3</option>`;
    if (maxGames === 5) return `<option value="3">3</option><option value="4">4</option><option value="5">5</option>`;
    if (maxGames === 7) return `<option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option>`;
    return '';
  }

  function populateMatchup(wrapperId, selectId, team1, team2, maxGames) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    wrapper.innerHTML = `
      <div class="matchup-card" id="${selectId}-card">
        <div class="matchup-team"><img src="${teamLogos[team1] || teamLogos['TBD']}" class="team-logo"><span class="team-name">${team1}</span></div>
        <div class="vs-separator">VS</div>
        <div class="matchup-team"><img src="${teamLogos[team2] || teamLogos['TBD']}" class="team-logo"><span class="team-name">${team2}</span></div>
        <div class="matchup-controls">
          <select class="winner-select" id="${selectId}">
            <option value="" disabled selected>Ganador</option>
            <option value="${team1}">${team1}</option>
            <option value="${team2}">${team2}</option>
          </select>
          <div class="series-length-control">
            <label for="${selectId}-length">Juegos:</label>
            <select class="length-select" id="${selectId}-length">
              <option value="" disabled selected>#</option>
              ${getLengthOptions(maxGames)}
            </select>
          </div>
        </div>
      </div>
    `;
    if (winners[selectId]) {
      wrapper.querySelector(`#${selectId}`).value = winners[selectId];
    }
  }

  function updateWorldSeriesCard() {
    const alChamp = winners['al-cs'] || 'TBD';
    const nlChamp = winners['nl-cs'] || 'TBD';
    document.getElementById('ws-al-team').innerHTML = `<img src="${teamLogos[alChamp] || teamLogos['TBD']}" class="team-logo"><span class="team-name">${alChamp}</span>`;
    document.getElementById('ws-nl-team').innerHTML = `<img src="${teamLogos[nlChamp] || teamLogos['TBD']}" class="team-logo"><span class="team-name">${nlChamp}</span>`;
    if (winners['al-cs'] && winners['nl-cs']) {
      const controlsWrapper = document.getElementById('ws-controls-wrapper');
      if (controlsWrapper && !controlsWrapper.hasChildNodes()) {
          controlsWrapper.innerHTML = `
            <div class="matchup-controls">
              <select class="winner-select" id="ws-winner">
                <option value="" disabled selected>Campeón</option>
                <option value="${alChamp}">${alChamp}</option>
                <option value="${nlChamp}">${nlChamp}</option>
              </select>
              <div class="series-length-control">
                <label for="ws-winner-length">Juegos:</label>
                <select class="length-select" id="ws-winner-length">
                  <option value="" disabled selected>#</option>
                  ${getLengthOptions(7)}
                </select>
              </div>
            </div>
          `;
      }
    }
    if (winners['ws-winner']) {
      const finalPredictionWrapper = document.getElementById('final-prediction-wrapper');
      if (finalPredictionWrapper && !finalPredictionWrapper.hasChildNodes()) {
          finalPredictionWrapper.innerHTML = `
            <div class="final-prediction-item">
              <label for="mvp">World Series MVP:</label>
              <input type="text" id="mvp" placeholder="Nombre del Jugador">
            </div>
            <div class="final-prediction-item">
              <label>Marcador Final (Tie-Breaker):</label>
              <div class="tie-breaker-controls">
                <input type="number" id="tie-breaker-score1" min="0" placeholder="0">
                <span>-</span>
                <input type="number" id="tie-breaker-score2" min="0" placeholder="0">
              </div>
            </div>
          `;
      }
    }
  }

  // --- 3. LÓGICA DEL BRACKET ---
  function updateBracket() {
    populateMatchup('al-ds1-wrapper', 'al-ds1', alSeeds[0], winners['al-wc1'] || 'TBD', 5);
    populateMatchup('al-ds2-wrapper', 'al-ds2', alSeeds[1], winners['al-wc2'] || 'TBD', 5);
    populateMatchup('nl-ds1-wrapper', 'nl-ds1', nlSeeds[0], winners['nl-wc1'] || 'TBD', 5);
    populateMatchup('nl-ds2-wrapper', 'nl-ds2', nlSeeds[1], winners['nl-wc2'] || 'TBD', 5);
    if (winners['al-ds1'] && winners['al-ds2']) {
      populateMatchup('al-cs-wrapper', 'al-cs', winners['al-ds1'], winners['al-ds2'], 7);
    }
    if (winners['nl-ds1'] && winners['nl-ds2']) {
      populateMatchup('nl-cs-wrapper', 'nl-cs', winners['nl-ds1'], winners['nl-ds2'], 7);
    }
    updateWorldSeriesCard();
  }
  
  // --- 4. INICIALIZACIÓN Y EVENTOS ---
  function initializeBracket() {
    populateMatchup('al-wc1-wrapper', 'al-wc1', alSeeds[3], alSeeds[4], 3);
    populateMatchup('al-wc2-wrapper', 'al-wc2', alSeeds[2], alSeeds[5], 3);
    populateMatchup('nl-wc1-wrapper', 'nl-wc1', nlSeeds[3], nlSeeds[4], 3);
    populateMatchup('nl-wc2-wrapper', 'nl-wc2', nlSeeds[2], nlSeeds[5], 3);
    updateBracket();
  }

  document.querySelector('.bracket').addEventListener('change', (e) => {
    if (e.target.tagName === 'SELECT') {
      winners[e.target.id] = e.target.value;
      updateBracket();
    }
  });
  
  // --- 5. VALIDACIÓN Y ENVÍO DEL FORMULARIO ---

  /**
   * NUEVO: Valida que todos los campos requeridos estén llenos.
   * @returns {boolean} - true si el formulario es válido, false si no.
   */
  function validateForm() {
    const missingFields = [];
    document.querySelectorAll('.invalid-field').forEach(el => el.classList.remove('invalid-field'));

    // IDs de todos los campos de selección de ganadores y duración
    const seriesIds = [
        'al-wc1', 'al-wc2', 'nl-wc1', 'nl-wc2',
        'al-ds1', 'al-ds2', 'nl-ds1', 'nl-ds2',
        'al-cs', 'nl-cs', 'ws-winner'
    ];

    // Validar selecciones de series
    seriesIds.forEach(id => {
        const winnerSelect = document.getElementById(id);
        const lengthSelect = document.getElementById(`${id}-length`);
        if (!winnerSelect || !winnerSelect.value) {
            missingFields.push(`Ganador de la serie ${id.toUpperCase()}`);
            if(winnerSelect) winnerSelect.classList.add('invalid-field');
        }
        if (!lengthSelect || !lengthSelect.value) {
            missingFields.push(`Duración de la serie ${id.toUpperCase()}`);
            if(lengthSelect) lengthSelect.classList.add('invalid-field');
        }
    });

    // Validar MVP y Tie-Breaker
    const mvpInput = document.getElementById('mvp');
    const tieBreaker1 = document.getElementById('tie-breaker-score1');
    const tieBreaker2 = document.getElementById('tie-breaker-score2');

    if (!mvpInput || !mvpInput.value) {
        missingFields.push("MVP de la Serie Mundial");
        if(mvpInput) mvpInput.classList.add('invalid-field');
    }
    if (!tieBreaker1 || !tieBreaker1.value) {
        missingFields.push("Marcador de Desempate (Equipo 1)");
        if(tieBreaker1) tieBreaker1.classList.add('invalid-field');
    }
     if (!tieBreaker2 || !tieBreaker2.value) {
        missingFields.push("Marcador de Desempate (Equipo 2)");
        if(tieBreaker2) tieBreaker2.classList.add('invalid-field');
    }

    // Validar información personal
    const personalInfoIds = { name: 'Nombre', email: 'Correo Electrónico', phone: 'Teléfono', payment: 'Método de pago' };
    for (const id in personalInfoIds) {
        const element = document.getElementById(id);
        if (!element.value) {
            missingFields.push(personalInfoIds[id]);
            element.classList.add('invalid-field');
        }
    }

    if (missingFields.length > 0) {
        alert(`Por favor, complete todos los campos requeridos:\n\n- ${missingFields.join('\n- ')}`);
        return false;
    }

    return true;
  }

  function getFormSelections() {
    const getValue = id => (document.getElementById(id) || {}).value || "";
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
      seriesLengths: {
        al_wc1: getValue("al-wc1-length"), al_wc2: getValue("al-wc2-length"),
        nl_wc1: getValue("nl-wc1-length"), nl_wc2: getValue("nl-wc2-length"),
        al_ds1: getValue("al-ds1-length"), al_ds2: getValue("al-ds2-length"),
        nl_ds1: getValue("nl-ds1-length"), nl_ds2: getValue("nl-ds2-length"),
        al_cs: getValue("al-cs-length"), nl_cs: getValue("nl-cs-length"),
        ws: getValue("ws-winner-length")
      }
    };
  }

  document.getElementById("prediction-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    // Llamar a la función de validación antes de continuar
    if (!validateForm()) {
        return; // Detener el envío si el formulario es inválido
    }

    const data = getFormSelections();
    console.log("📥 Enviando predicción:", data);
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
      } else {
        throw new Error(result.error || "Hubo un error al enviar tu predicción.");
      }
    } catch (err) {
      console.error("❌ Error al enviar:", err);
      alert("Error al enviar la predicción. Revisa la consola para más detalles.");
    }
  });

  initializeBracket();
});
