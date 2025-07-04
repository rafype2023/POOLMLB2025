document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#results-table tbody");
  const adminPanel = document.getElementById("admin-panel");
  const adminForm = document.getElementById("admin-form");
  const detailViewContainer = document.getElementById("detail-view-container");
  
  const urlParams = new URLSearchParams(window.location.search);
  const adminKey = urlParams.get('key');

  let masterJugadas = [];
  let masterCorrectResults = {};

  const pointRules = {
    wc: { winner: 2, length: 1 },
    ds: { winner: 4, length: 2 },
    cs: { winner: 8, length: 3 },
    ws: { winner: 16, length: 4 },
    mvp: 3,
  };

  // --- ADMIN PANEL LOGIC ---

  function showAdminPanel() {
    if (!adminPanel || !adminForm) return;
    adminPanel.style.display = "block";
    const allTeams = [
        "New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins",
        "Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres"
    ];
    
    const seriesData = [
      { id: 'al-wc1', label: 'AL Wild Card 1', round: 'wc' }, { id: 'al-wc2', label: 'AL Wild Card 2', round: 'wc' },
      { id: 'nl-wc1', label: 'NL Wild Card 1', round: 'wc' }, { id: 'nl-wc2', label: 'NL Wild Card 2', round: 'wc' },
      { id: 'al-ds1', label: 'AL Division Series 1', round: 'ds' }, { id: 'al-ds2', label: 'AL Division Series 2', round: 'ds' },
      { id: 'nl-ds1', label: 'NL Division Series 1', round: 'ds' }, { id: 'nl-ds2', label: 'NL Division Series 2', round: 'ds' },
      { id: 'al-cs', label: 'AL Championship Series', round: 'cs' }, { id: 'nl-cs', label: 'NL Championship Series', round: 'cs' },
      { id: 'ws-winner', label: 'World Series', round: 'ws' },
    ];
    
    seriesData.forEach(s => buildAdminMatchup(s.id, s.label, allTeams, masterCorrectResults, s.round));
    
    const mvpContainer = document.getElementById('admin-mvp');
    if (mvpContainer) {
        mvpContainer.innerHTML = `
            <label>Correct World Series MVP</label>
            <input type="text" id="correct-worldSeriesMVP" placeholder="Nombre del Jugador">
        `;
        if (masterCorrectResults.worldSeriesMVP) {
            document.getElementById('correct-worldSeriesMVP').value = masterCorrectResults.worldSeriesMVP;
        }
    }

    adminForm.addEventListener("submit", handleAdminFormSubmit);
  }

  function buildAdminMatchup(id, label, teams, correctResults, round) {
      const container = document.getElementById(`admin-${id}`);
      if (!container) return;
      const lengthOptions = { wc: [2, 3], ds: [3, 4, 5], cs: [4, 5, 6, 7], ws: [4, 5, 6, 7] };
      let optionsHTML = '<option value="">-- Elige Ganador --</option>';
      teams.forEach(t => optionsHTML += `<option value="${t}">${t}</option>`);

      container.innerHTML = `
        <label>${label}</label>
        <select id="correct-${id}-winner">${optionsHTML}</select>
        <label>Duración de Serie:</label>
        <select id="correct-${id}-length">
            <option value="">-- Elige Duración --</option>
            ${lengthOptions[round].map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
      `;
      
      if (correctResults.winners && correctResults.winners[id]) {
          document.getElementById(`correct-${id}-winner`).value = correctResults.winners[id];
      }
      if (correctResults.seriesLengths && correctResults.seriesLengths[id]) {
          document.getElementById(`correct-${id}-length`).value = correctResults.seriesLengths[id];
      }
  }
  
  async function handleAdminFormSubmit(e) {
      e.preventDefault();
      const resultsToSave = { winners: {}, seriesLengths: {}, worldSeriesMVP: '' };
      
      document.querySelectorAll('#admin-form select, #admin-form input').forEach(el => {
          if (!el.id.startsWith('correct-')) return;
          const id = el.id.replace('correct-', '');
          
          if (id.endsWith('-winner')) {
              const seriesId = id.replace('-winner', '');
              if (el.value) resultsToSave.winners[seriesId] = el.value;
          } else if (id.endsWith('-length')) {
              const seriesId = id.replace('-length', '');
              if (el.value) resultsToSave.seriesLengths[seriesId] = el.value;
          } else if (id === 'worldSeriesMVP') {
              if (el.value) resultsToSave.worldSeriesMVP = el.value;
          }
      });

      try {
          const response = await fetch(`/api/set-results?key=${adminKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resultsToSave),
          });
          if (!response.ok) throw new Error('Falló al guardar los resultados');
          alert('¡Resultados guardados con éxito!');
          location.reload();
      } catch (error) {
          console.error('Error guardando resultados:', error);
          alert(`Error: ${error.message}`);
      }
  }

  // --- LÓGICA DE LA VISTA DE DETALLE (MODAL) ---

  function showDetailView(jugadaId) {
      const jugada = masterJugadas.find(j => j._id === jugadaId);
      if (!jugada || !detailViewContainer) return;
      detailViewContainer.innerHTML = buildDetailViewHTML(jugada, masterCorrectResults);
      detailViewContainer.classList.remove('hidden');
      detailViewContainer.querySelector('.close-detail-btn').addEventListener('click', () => {
          detailViewContainer.classList.add('hidden');
      });
  }

  function buildDetailViewHTML(jugada, correct) {
      const correctWinners = correct.winners || {};
      const correctLengths = correct.seriesLengths || {};

      const createPickHTML = (label, userWinner, userLength, correctWinner, correctLength) => {
          let className = '';
          if (correctWinner) {
              className = (userWinner === correctWinner) ? 'correct' : 'incorrect';
          }
          let lengthInfo = `(en ${userLength || '?'} juegos)`;
          if (className === 'correct' && userLength && correctLength && userLength == correctLength) {
              lengthInfo += ' ✅';
          }
          return `<div class="detail-pick"><span class="pick-label">${label}:</span> <span class="pick-team ${className}">${userWinner || 'N/A'}</span> <span class="pick-length">${lengthInfo}</span></div>`;
      };
      
      const alWC = (jugada.alWCWinners || []).map((winner, i) => createPickHTML(`ALWC ${i + 1}`, winner, jugada.seriesLengths?.[`al-wc${i + 1}`], correctWinners[`al-wc${i + 1}`], correctLengths[`al-wc${i + 1}`])).join('');
      const nlWC = (jugada.nlWCWinners || []).map((winner, i) => createPickHTML(`NLWC ${i + 1}`, winner, jugada.seriesLengths?.[`nl-wc${i + 1}`], correctWinners[`nl-wc${i + 1}`], correctLengths[`nl-wc${i + 1}`])).join('');
      const alDS = (jugada.alDSWinners || []).map((winner, i) => createPickHTML(`ALDS ${i + 1}`, winner, jugada.seriesLengths?.[`al-ds${i + 1}`], correctWinners[`al-ds${i + 1}`], correctLengths[`al-ds${i + 1}`])).join('');
      const nlDS = (jugada.nlDSWinners || []).map((winner, i) => createPickHTML(`NLDS ${i + 1}`, winner, jugada.seriesLengths?.[`nl-ds${i + 1}`], correctWinners[`nl-ds${i + 1}`], correctLengths[`nl-ds${i + 1}`])).join('');
      const alCS = createPickHTML('ALCS', jugada.alCSWinner, jugada.seriesLengths?.['al-cs'], correctWinners['al-cs'], correctLengths['al-cs']);
      const nlCS = createPickHTML('NLCS', jugada.nlCSWinner, jugada.seriesLengths?.['nl-cs'], correctWinners['nl-cs'], correctLengths['nl-cs']);
      const ws = createPickHTML('World Series', jugada.worldSeriesWinner, jugada.seriesLengths?.['ws-winner'], correctWinners['ws-winner'], correctLengths['ws-winner']);
      const mvp = `<div class="detail-pick"><span class="pick-label">MVP:</span> ${jugada.worldSeriesMVP || 'N/A'}</div>`;
      const tiebreaker = `<div class="detail-pick"><span class="pick-label">Desempate:</span> ${(jugada.tieBreakerScore || []).join(' - ')}</div>`;

      return `
        <div class="detail-card">
          <div class="detail-header"><h2>Detalle de Jugada: ${jugada.name}</h2><button class="close-detail-btn">&times;</button></div>
          <div class="detail-grid">
            <div class="detail-round"><h3>Wild Card</h3>${alWC}${nlWC}</div>
            <div class="detail-round"><h3>Division Series</h3>${alDS}${nlDS}</div>
            <div class="detail-round"><h3>Championship</h3>${alCS}${nlCS}</div>
            <div class="detail-round"><h3>Final</h3>${ws}${mvp}${tiebreaker}</div>
          </div>
        </div>
      `;
  }

  // --- LÓGICA DE PUNTUACIÓN Y TABLA PRINCIPAL ---

  async function main() {
    try {
      const [jugadasResponse, correctResultsResponse] = await Promise.all([
        fetch("/api/jugadas"), fetch("/api/get-results")
      ]);
      if (!jugadasResponse.ok || !correctResultsResponse.ok) throw new Error('Falló al obtener los datos');
      
      masterJugadas = await jugadasResponse.json();
      masterCorrectResults = await correctResultsResponse.json();

      if (adminKey) showAdminPanel();

      tableBody.innerHTML = "";
      if (masterJugadas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No hay predicciones.</td></tr>`;
        return;
      }
      
      const scoredJugadas = masterJugadas.map(jugada => {
        let totalPoints = 0;
        const correctW = masterCorrectResults.winners || {};
        const correctL = masterCorrectResults.seriesLengths || {};

        const scoreRound = (userWinners, seriesPrefix, roundKey) => {
            let points = 0;
            if (!userWinners || !Array.isArray(userWinners)) return 0;
            userWinners.forEach((winner, i) => {
                const sId = `${seriesPrefix}${i+1}`;
                if (winner && winner === correctW[sId]) {
                    points += pointRules[roundKey].winner;
                    if (jugada.seriesLengths?.[sId] && correctL[sId] && jugada.seriesLengths[sId] == correctL[sId]) {
                        points += pointRules[roundKey].length;
                    }
                }
            });
            return points;
        };

        const scoreSingleSeries = (userWinner, seriesId, roundKey) => {
            let points = 0;
            if (userWinner && userWinner === correctW[seriesId]) {
                points += pointRules[roundKey].winner;
                if (jugada.seriesLengths?.[seriesId] && correctL[seriesId] && jugada.seriesLengths[seriesId] == correctL[seriesId]) {
                    points += pointRules[roundKey].length;
                }
            }
            return points;
        };
        
        totalPoints += scoreRound(jugada.alWCWinners, 'al-wc', 'wc');
        totalPoints += scoreRound(jugada.nlWCWinners, 'nl-wc', 'wc');
        totalPoints += scoreRound(jugada.alDSWinners, 'al-ds', 'ds');
        totalPoints += scoreRound(jugada.nlDSWinners, 'nl-ds', 'ds');
        totalPoints += scoreSingleSeries(jugada.alCSWinner, 'al-cs', 'cs');
        totalPoints += scoreSingleSeries(jugada.nlCSWinner, 'nl-cs', 'cs');
        totalPoints += scoreSingleSeries(jugada.worldSeriesWinner, 'ws-winner', 'ws');
        
        const playerMVP = jugada.worldSeriesMVP || '';
        const correctMVP = masterCorrectResults.worldSeriesMVP || '';
        if (playerMVP && correctMVP && playerMVP.trim().toLowerCase() === correctMVP.trim().toLowerCase()) {
            totalPoints += pointRules.mvp;
        }
        
        return { ...jugada, totalPoints };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      scoredJugadas.forEach((jugada, index) => {
        const row = document.createElement("tr");
        row.dataset.jugadaId = jugada._id;
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${jugada.name || 'N/A'}</td>
          <td><b>${jugada.totalPoints}</b></td>
          <td>${jugada.worldSeriesWinner || 'N/A'}</td>
          <td>${jugada.worldSeriesMVP || 'N/A'}</td>
        `;
        row.addEventListener('click', () => showDetailView(jugada._id));
        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error("Error al cargar y puntuar los resultados:", error);
      tableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No se pudieron cargar los resultados. Por favor, revise la consola.</td></tr>`;
    }
  }

  main();
});
