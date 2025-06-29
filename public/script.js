document.addEventListener("DOMContentLoaded", function () {
  // --- 1. CONFIGURATION ---
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

  // --- 2. DYNAMIC ELEMENT CREATION ---

  /**
   * Generates the HTML options for the series length dropdown.
   * @param {number} maxGames - The max number of games (3, 5, or 7).
   * @returns {string} - The HTML string for the options.
   */
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
            <div class="mvp-input-wrapper">
              <label for="mvp">World Series MVP:</label>
              <input type="text" id="mvp" placeholder="Nombre del Jugador">
            </div>
          `;
      }
    }
  }

  // --- 3. BRACKET UPDATE LOGIC ---
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
  
  // --- 4. INITIALIZATION & EVENT HANDLING ---
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
  
  // --- 5. FORM SUBMISSION ---
  function getFormSelections() {
    const getValue = id => (document.getElementById(id) || {}).value || "";
    
    return {
      name: getValue("name"), email: getValue("email"), phone: getValue("phone"),
      paymentMethod: getValue("payment"), comments: getValue("comments"),
      worldSeriesMVP: getValue("mvp"),
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
