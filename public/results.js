document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#results-table tbody");
  const adminPanel = document.getElementById("admin-panel");
  const adminForm = document.getElementById("admin-form");
  const urlParams = new URLSearchParams(window.location.search);
  const adminKey = urlParams.get('key');

  // Reglas de puntuación basadas en el PDF
  const pointRules = {
    wc: { winner: 2, length: 1 },
    ds: { winner: 4, length: 2 },
    cs: { winner: 8, length: 3 },
    ws: { winner: 16, length: 4 },
  };

  // --- LÓGICA DEL PANEL DE ADMINISTRADOR ---

  function showAdminPanel(correctResults) {
    if (!adminPanel) return;
    adminPanel.style.display = "block";

    const allTeams = [
        "New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins",
        "Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres"
    ];
    
    // Define todas las series para el formulario de admin
    const seriesData = [
      { id: 'al-wc1', label: 'AL Wild Card 1', round: 'wc' },
      { id: 'al-wc2', label: 'AL Wild Card 2', round: 'wc' },
      { id: 'nl-wc1', label: 'NL Wild Card 1', round: 'wc' },
      { id: 'nl-wc2', label: 'NL Wild Card 2', round: 'wc' },
      { id: 'al-ds1', label: 'AL Division Series 1', round: 'ds' },
      { id: 'al-ds2', label: 'AL Division Series 2', round: 'ds' },
      { id: 'nl-ds1', label: 'NL Division Series 1', round: 'ds' },
      { id: 'nl-ds2', label: 'NL Division Series 2', round: 'ds' },
      { id: 'al-cs', label: 'AL Championship Series', round: 'cs' },
      { id: 'nl-cs', label: 'NL Championship Series', round: 'cs' },
      { id: 'ws', label: 'World Series', round: 'ws' },
    ];
    
    seriesData.forEach(s => buildAdminMatchup(s.id, s.label, allTeams, correctResults, s.round));
    
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
      
      // Pre-seleccionar valores guardados
      if (correctResults.winners && correctResults.winners[id]) {
          document.getElementById(`correct-${id}-winner`).value = correctResults.winners[id];
      }
      if (correctResults.seriesLengths && correctResults.seriesLengths[id]) {
          document.getElementById(`correct-${id}-length`).value = correctResults.seriesLengths[id];
      }
  }
  
  async function handleAdminFormSubmit(e) {
      e.preventDefault();
      const resultsToSave = { winners: {}, seriesLengths: {} };
      
      document.querySelectorAll('#admin-form select').forEach(select => {
          const id = select.id.replace('correct-', '');
          if (id.endsWith('-winner')) {
              const seriesId = id.replace('-winner', '');
              if (select.value) resultsToSave.winners[seriesId] = select.value;
          } else if (id.endsWith('-length')) {
              const seriesId = id.replace('-length', '');
              if (select.value) resultsToSave.seriesLengths[seriesId] = select.value;
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

  // --- LÓGICA DE PUNTUACIÓN Y VISUALIZACIÓN ---

  async function calculateAndDisplayScores() {
    try {
      const [jugadasResponse, correctResultsResponse] = await Promise.all([
        fetch("/api/jugadas"),
        fetch("/api/get-results")
      ]);
      
      if (!jugadasResponse.ok || !correctResultsResponse.ok) throw new Error('Falló al obtener los datos');

      const jugadas = await jugadasResponse.json();
      const correctResults = await correctResultsResponse.json();

      if (adminKey) {
        showAdminPanel(correctResults || {});
      }

      tableBody.innerHTML = ""; 

      if (jugadas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No hay predicciones.</td></tr>`;
        return;
      }
      
      const scoredJugadas = jugadas.map(jugada => {
        let totalPoints = 0;
        const correct = correctResults || {};
        const correctWinners = correct.winners || {};
        const correctLengths = correct.seriesLengths || {};

        // Función para calcular puntos de una serie
        const scoreSeries = (seriesId, roundKey) => {
            let points = 0;
            const userWinner = jugada[seriesId];
            const correctWinner = correctWinners[seriesId.replace(/([A-Z])/g, '_$1').toLowerCase()]; // ej. alCSWinner -> al_cs_winner
            
            // Lógica para series con múltiples ganadores (WC, DS)
            if (Array.isArray(jugada[seriesId])) {
                jugada[seriesId].forEach((winner, index) => {
                    const sId = `${roundKey}${index + 1}`; // ej. al_wc1
                    if (winner && correctWinners[sId] === winner) {
                        points += pointRules[roundKey.split('_')[1]].winner;
                        if (jugada.seriesLengths?.[sId] && correctLengths?.[sId] == jugada.seriesLengths[sId]) {
                            points += pointRules[roundKey.split('_')[1]].length;
                        }
                    }
                });
            } else { // Lógica para series con un solo ganador (CS, WS)
                const sId = roundKey;
                if (userWinner && correctWinners[sId] === userWinner) {
                    points += pointRules[roundKey].winner;
                    if (jugada.seriesLengths?.[sId] && correctLengths?.[sId] == jugada.seriesLengths[sId]) {
                        points += pointRules[roundKey].length;
                    }
                }
            }
            return points;
        };
        
        // Calcular puntos para cada ronda
        totalPoints += scoreSeries('alWCWinners', 'al_wc');
        totalPoints += scoreSeries('nlWCWinners', 'nl_wc');
        totalPoints += scoreSeries('alDSWinners', 'al_ds');
        totalPoints += scoreSeries('nlDSWinners', 'nl_ds');
        totalPoints += scoreSeries('alCSWinner', 'cs');
        totalPoints += scoreSeries('nlCSWinner', 'cs');
        totalPoints += scoreSeries('worldSeriesWinner', 'ws');

        return { ...jugada, totalPoints };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      scoredJugadas.forEach((jugada, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${jugada.name || 'N/A'}</td>
          <td><b>${jugada.totalPoints}</b></td>
          <td>${jugada.worldSeriesWinner || 'N/A'}</td>
          <td>${jugada.worldSeriesMVP || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error("Error al cargar y puntuar los resultados:", error);
      tableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No se pudieron cargar los resultados. Por favor, revise la consola.</td></tr>`;
    }
  }

  calculateAndDisplayScores();
});
