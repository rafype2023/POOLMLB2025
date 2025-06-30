document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#results-table tbody");
  const adminPanel = document.getElementById("admin-panel");
  const adminForm = document.getElementById("admin-form");
  const urlParams = new URLSearchParams(window.location.search);
  const adminKey = urlParams.get('key');

  // Scoring rules based on the provided PDF
  const pointRules = {
    wc_winner: 2,
    ds_winner: 4,
    cs_winner: 8,
    ws_winner: 16,
    wc_length: 1,
    ds_length: 2,
    cs_length: 3,
    ws_length: 4,
  };

  // --- ADMIN PANEL LOGIC ---

  function showAdminPanel(correctResults) {
    if (!adminPanel) return;
    adminPanel.style.display = "block";

    const allTeams = [
        "New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins",
        "Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres"
    ];
    
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

  function getCorrectWinner(id, results) {
      if (!results) return '';
      if (id === 'al-cs') return results.alCSWinner;
      if (id === 'nl-cs') return results.nlCSWinner;
      if (id === 'ws') return results.worldSeriesWinner;
      
      if (id.startsWith('al-wc')) return (results.alWCWinners || [])[parseInt(id.slice(-1)) - 1];
      if (id.startsWith('nl-wc')) return (results.nlWCWinners || [])[parseInt(id.slice(-1)) - 1];
      if (id.startsWith('al-ds')) return (results.alDSWinners || [])[parseInt(id.slice(-1)) - 1];
      if (id.startsWith('nl-ds')) return (results.nlDSWinners || [])[parseInt(id.slice(-1)) - 1];
      return '';
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
      
      if (correctResults.seriesLengths && correctResults.seriesLengths[id]) {
          document.getElementById(`correct-${id}-length`).value = correctResults.seriesLengths[id];
      }
      const correctWinner = getCorrectWinner(id, correctResults);
      if(correctWinner) {
        document.getElementById(`correct-${id}-winner`).value = correctWinner;
      }
  }
  
  async function handleAdminFormSubmit(e) {
      e.preventDefault();
      const resultsToSave = {
          seriesLengths: {},
          alWCWinners: [], nlWCWinners: [],
          alDSWinners: [], nlDSWinners: [],
          alCSWinner: '', nlCSWinner: '',
          worldSeriesWinner: ''
      };
      
      document.querySelectorAll('#admin-form select').forEach(select => {
          const id = select.id.replace('correct-', '');
          if (id.endsWith('-length')) {
              const seriesId = id.replace('-length', '');
              if(select.value) resultsToSave.seriesLengths[seriesId] = select.value;
          } else if (id.endsWith('-winner')) {
              const seriesId = id.replace('-winner', '');
              const winnerValue = select.value;
              if (winnerValue) {
                  if (seriesId === 'al-wc1') resultsToSave.alWCWinners[0] = winnerValue;
                  else if (seriesId === 'al-wc2') resultsToSave.alWCWinners[1] = winnerValue;
                  else if (seriesId === 'nl-wc1') resultsToSave.nlWCWinners[0] = winnerValue;
                  else if (seriesId === 'nl-wc2') resultsToSave.nlWCWinners[1] = winnerValue;
                  else if (seriesId === 'al-ds1') resultsToSave.alDSWinners[0] = winnerValue;
                  else if (seriesId === 'al-ds2') resultsToSave.alDSWinners[1] = winnerValue;
                  else if (seriesId === 'nl-ds1') resultsToSave.nlDSWinners[0] = winnerValue;
                  else if (seriesId === 'nl-ds2') resultsToSave.nlDSWinners[1] = winnerValue;
                  else if (seriesId === 'al-cs') resultsToSave.alCSWinner = winnerValue;
                  else if (seriesId === 'nl-cs') resultsToSave.nlCSWinner = winnerValue;
                  else if (seriesId === 'ws') resultsToSave.worldSeriesWinner = winnerValue;
              }
          }
      });

      try {
          const response = await fetch(`/api/set-results?key=${adminKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resultsToSave),
          });
          if(!response.ok) throw new Error('Failed to save results');
          alert('Resultados guardados con éxito!');
          location.reload();
      } catch (error) {
          console.error('Error saving results:', error);
          alert(`Error: ${error.message}`);
      }
  }


  // --- SCORING AND DISPLAY LOGIC ---

  async function calculateAndDisplayScores() {
    try {
      const [jugadasResponse, correctResultsResponse] = await Promise.all([
        fetch("/api/jugadas"),
        fetch("/api/get-results")
      ]);
      
      if(!jugadasResponse.ok || !correctResultsResponse.ok) throw new Error('Failed to fetch data');

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
        
        const calculateRoundPoints = (userWinners, correctWinners, userLengths, correctLengths, seriesPrefix, winnerPoints, lengthPoints) => {
            let points = 0;
            if (!userWinners || !correctWinners) return 0;
            userWinners.forEach((winner, index) => {
                if (winner && correctWinners.includes(winner)) {
                    points += winnerPoints;
                    const seriesId = `${seriesPrefix}${index + 1}`;
                    if (userLengths?.[seriesId] && correctLengths?.[seriesId] && userLengths[seriesId] == correctLengths[seriesId]) {
                        points += lengthPoints;
                    }
                }
            });
            return points;
        };

        totalPoints += calculateRoundPoints(jugada.alWCWinners, correct.alWCWinners, jugada.seriesLengths, correct.seriesLengths, 'al_wc', pointRules.wc_winner, pointRules.wc_length);
        totalPoints += calculateRoundPoints(jugada.nlWCWinners, correct.nlWCWinners, jugada.seriesLengths, correct.seriesLengths, 'nl_wc', pointRules.wc_winner, pointRules.wc_length);
        
        totalPoints += calculateRoundPoints(jugada.alDSWinners, correct.alDSWinners, jugada.seriesLengths, correct.seriesLengths, 'al_ds', pointRules.ds_winner, pointRules.ds_length);
        totalPoints += calculateRoundPoints(jugada.nlDSWinners, correct.nlDSWinners, jugada.seriesLengths, correct.seriesLengths, 'nl_ds', pointRules.ds_winner, pointRules.ds_length);

        if (jugada.alCSWinner && jugada.alCSWinner === correct.alCSWinner) {
            totalPoints += pointRules.cs_winner;
            if (jugada.seriesLengths?.al_cs && correct.seriesLengths?.al_cs && jugada.seriesLengths.al_cs == correct.seriesLengths.al_cs) {
                totalPoints += pointRules.cs_length;
            }
        }
        if (jugada.nlCSWinner && jugada.nlCSWinner === correct.nlCSWinner) {
            totalPoints += pointRules.cs_winner;
            if (jugada.seriesLengths?.nl_cs && correct.seriesLengths?.nl_cs && jugada.seriesLengths.nl_cs == correct.seriesLengths.nl_cs) {
                totalPoints += pointRules.cs_length;
            }
        }

        if(jugada.worldSeriesWinner && jugada.worldSeriesWinner === correct.worldSeriesWinner) {
            totalPoints += pointRules.ws_winner;
            if(jugada.seriesLengths?.ws && correct.seriesLengths?.ws && jugada.seriesLengths.ws == correct.seriesLengths.ws) {
                totalPoints += pointRules.ws_length;
            }
        }
        
        return { ...jugada, totalPoints };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      scoredJugadas.forEach((jugada, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${jugada.name || 'N/A'}</td>
          <td>${jugada.totalPoints}</td>
          <td>${jugada.worldSeriesWinner || 'N/A'}</td>
          <td>${jugada.worldSeriesMVP || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error("Error al cargar y puntuar los resultados:", error);
      tableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No se pudieron cargar los resultados. Por favor, revisa la consola.</td></tr>`;
    }
  }

  calculateAndDisplayScores();
});
