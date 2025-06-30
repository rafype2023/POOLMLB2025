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

    // This function needs the full list of potential teams to build dropdowns
    const allTeams = [
        "New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins",
        "Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres"
    ];
    
    // Define all series for the admin form
    const seriesData = [
      { id: 'al-wc1', label: 'AL Wild Card 1', teams: allTeams, round: 'wc' },
      { id: 'al-wc2', label: 'AL Wild Card 2', teams: allTeams, round: 'wc' },
      { id: 'nl-wc1', label: 'NL Wild Card 1', teams: allTeams, round: 'wc' },
      { id: 'nl-wc2', label: 'NL Wild Card 2', teams: allTeams, round: 'wc' },
      { id: 'al-ds1', label: 'AL Division Series 1', teams: allTeams, round: 'ds' },
      { id: 'al-ds2', label: 'AL Division Series 2', teams: allTeams, round: 'ds' },
      { id: 'nl-ds1', label: 'NL Division Series 1', teams: allTeams, round: 'ds' },
      { id: 'nl-ds2', label: 'NL Division Series 2', teams: allTeams, round: 'ds' },
      { id: 'al-cs', label: 'AL Championship Series', teams: allTeams, round: 'cs' },
      { id: 'nl-cs', label: 'NL Championship Series', teams: allTeams, round: 'cs' },
      { id: 'ws', label: 'World Series', teams: allTeams, round: 'ws' },
    ];
    
    seriesData.forEach(s => buildAdminMatchup(s.id, s.label, s.teams, correctResults, s.round));
    
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
      
      // Pre-select saved values
      if (correctResults.seriesLengths && correctResults.seriesLengths[id]) {
          document.getElementById(`correct-${id}-length`).value = correctResults.seriesLengths[id];
      }
      // This is a simplified way to get the winner; a more robust way would be needed for a full implementation
      const winner = (correctResults.alWCWinners || []).concat(correctResults.nlWCWinners || [], correctResults.alDSWinners || [], correctResults.nlDSWinners || [], [correctResults.alCSWinner, correctResults.nlCSWinner, correctResults.worldSeriesWinner]).find(w => w); // This needs refinement
      if(winner) document.getElementById(`correct-${id}-winner`).value = winner;

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
              if (seriesId.startsWith('al-wc')) resultsToSave.alWCWinners.push(select.value);
              else if (seriesId.startsWith('nl-wc')) resultsToSave.nlWCWinners.push(select.value);
              else if (seriesId.startsWith('al-ds')) resultsToSave.alDSWinners.push(select.value);
              else if (seriesId.startsWith('nl-ds')) resultsToSave.nlDSWinners.push(select.value);
              else if (seriesId === 'al-cs') resultsToSave.alCSWinner = select.value;
              else if (seriesId === 'nl-cs') resultsToSave.nlCSWinner = select.value;
              else if (seriesId === 'ws') resultsToSave.worldSeriesWinner = select.value;
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
        
        // Helper function to calculate points for a round
        const calculateRoundPoints = (userWinners, correctWinners, userLengths, correctLengths, seriesPrefix, winnerPoints, lengthPoints) => {
            let points = 0;
            userWinners.forEach((winner, index) => {
                if (correctWinners && correctWinners.includes(winner)) {
                    points += winnerPoints;
                    const seriesId = `${seriesPrefix}${index + 1}`;
                    if (userLengths?.[seriesId] && correctLengths?.[seriesId] && userLengths[seriesId] == correctLengths[seriesId]) {
                        points += lengthPoints;
                    }
                }
            });
            return points;
        };

        // WC Points
        totalPoints += calculateRoundPoints(jugada.alWCWinners, correct.alWCWinners, jugada.seriesLengths, correct.seriesLengths, 'al_wc', pointRules.wc_winner, pointRules.wc_length);
        totalPoints += calculateRoundPoints(jugada.nlWCWinners, correct.nlWCWinners, jugada.seriesLengths, correct.seriesLengths, 'nl_wc', pointRules.wc_winner, pointRules.wc_length);
        
        // DS Points
        totalPoints += calculateRoundPoints(jugada.alDSWinners, correct.alDSWinners, jugada.seriesLengths, correct.seriesLengths, 'al_ds', pointRules.ds_winner, pointRules.ds_length);
        totalPoints += calculateRoundPoints(jugada.nlDSWinners, correct.nlDSWinners, jugada.seriesLengths, correct.seriesLengths, 'nl_ds', pointRules.ds_winner, pointRules.ds_length);

        // CS Points
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

        // WS Points
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
      tableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No se pudieron cargar los resultados.</td></tr>`;
    }
  }

  calculateAndDisplayScores();
});
