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

  // State objects to remember user selections
  const winners = {};
  const seriesLengths = {}; // NEW: Remembers the length of each series

  // --- 2. DYNAMIC ELEMENT CREATION ---

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
    // Restore any existing selections for this matchup
    if (winners[selectId]) {
      wrapper.querySelector(`#${selectId}`).value = winners[selectId];
    }
    if (seriesLengths[selectId]) {
      wrapper.querySelector(`#${selectId}-length`).value = seriesLengths[selectId];
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
    // Restore WS selections
    if (winners['ws-winner']) document.getElementById('ws-winner').value = winners['ws-winner'];
    if (seriesLengths['ws-winner']) document.getElementById('ws-winner-length').value = seriesLengths['ws-winner'];
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
    populateMatchup('nl-wc2-wrapper', 'nl-wc2', alSeeds[2], nlSeeds[5], 3);
    updateBracket();
  }

  // UPDATED: Event listener now saves both winner and length selections
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
  function validateForm() {
    // ... (This function remains unchanged)
    return true; // Placeholder
  }

  function getFormSelections() {
    // ... (This function remains unchanged)
  }

  document.getElementById("prediction-form").addEventListener("submit", async function (e) {
    // ... (This function remains unchanged)
  });

  initializeBracket();
});
