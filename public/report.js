document.addEventListener("DOMContentLoaded", function () {
  const reportContainer = document.getElementById("report-container");

  const pointRules = {
    wc: { winner: 2, length: 1 },
    ds: { winner: 4, length: 2 },
    cs: { winner: 8, length: 3 },
    ws: { winner: 16, length: 4 },
    mvp: 3, // <-- NEW RULE
  };

  function createComparisonRow(seriesName, playerPick, playerLength, clavePick, claveLength, points) {
    // ... (This function remains the same)
  }

  function createPlayerReportCard(playerData) {
    // ... (This function remains the same)
  }
  
  function processAllJugadas(allJugadas) {
    const claveEntry = allJugadas.find(j => j.name === 'CLAVE' && j.email === 'rafyperez@gmail.com');
    if (!claveEntry) { /* ... */ return []; }
    const players = allJugadas.filter(j => j._id !== claveEntry._id);

    return players.map(player => {
      let totalPoints = 0;
      const reportData = { wc: [], ds: [], cs: [], final: [] };

      // ... (Existing scoring logic for series winners and lengths)

      // --- NEW: MVP SCORING LOGIC ---
      let mvpPoints = 0;
      const playerMVP = player.worldSeriesMVP || '';
      const claveMVP = claveEntry.worldSeriesMVP || '';
      if (playerMVP && claveMVP && playerMVP.trim().toLowerCase() === claveMVP.trim().toLowerCase()) {
          mvpPoints = pointRules.mvp;
      }
      totalPoints += mvpPoints;

      // Add MVP row to the report data, now including points
      reportData.final.push({ 
          name: 'MVP', 
          playerPick: player.worldSeriesMVP, 
          clavePick: claveEntry.worldSeriesMVP, 
          points: mvpPoints,
          playerLength: 'N/A', // Add placeholders for table structure
          claveLength: 'N/A'
      });
      
      reportData.final.push({ name: 'Tie-Breaker', playerPick: (player.tieBreakerScore || []).join(' - '), clavePick: (claveEntry.tieBreakerScore || []).join(' - '), points: 0, playerLength: 'N/A', claveLength: 'N/A' });

      return { ...player, totalPoints, reportData };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async function buildReport() {
    // ... (This function remains the same)
  }

  buildReport();
});
