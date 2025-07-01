document.addEventListener("DOMContentLoaded", function () {
  const reportContainer = document.getElementById("report-container");

  const pointRules = { /* ... (sin cambios) ... */ };

  function createComparisonRow(seriesName, playerPick, playerLength, clavePick, claveLength, points) { /* ... (sin cambios) ... */ }
  function createPlayerReportCard(playerData) { /* ... (sin cambios) ... */ }
  
  function processAllJugadas(allJugadas) {
    const claveEntry = allJugadas.find(j => j.name === 'CLAVE' && j.email === 'rafyperez@gmail.com');
    if (!claveEntry) {
      reportContainer.innerHTML = `<p class="loading-message">No se encontró la jugada "CLAVE".</p>`;
      return [];
    }
    const players = allJugadas.filter(j => j._id !== claveEntry._id);

    return players.map(player => {
      let totalPoints = 0;
      const reportData = { wc: [], ds: [], cs: [], final: [] };
      const seriesMapping = [
        { key: 'alWCWinners', prefix: 'ALWC', round: 'wc', lenPrefix: 'al-wc' }, // CORREGIDO
        { key: 'nlWCWinners', prefix: 'NLWC', round: 'wc', lenPrefix: 'nl-wc' }, // CORREGIDO
        { key: 'alDSWinners', prefix: 'ALDS', round: 'ds', lenPrefix: 'al-ds' }, // CORREGIDO
        { key: 'nlDSWinners', prefix: 'NLDS', round: 'ds', lenPrefix: 'nl-ds' }, // CORREGIDO
      ];

      seriesMapping.forEach(map => {
        (player[map.key] || []).forEach((playerPick, i) => {
          const clavePick = (claveEntry[map.key] || [])[i];
          // CORREGIDO: Buscar con guion
          const playerLength = player.seriesLengths?.[`${map.lenPrefix}${i+1}`];
          const claveLength = claveEntry.seriesLengths?.[`${map.lenPrefix}${i+1}`];
          let points = 0;
          if (playerPick && clavePick && playerPick === clavePick) {
            points += pointRules[map.round].winner;
            if (playerLength && claveLength && playerLength === claveLength) {
              points += pointRules[map.round].length;
            }
          }
          totalPoints += points;
          reportData[map.round].push({ name: `${map.prefix} ${i+1}`, playerPick, playerLength, clavePick, claveLength, points });
        });
      });

      const finalSeriesMapping = [
        { key: 'alCSWinner', name: 'ALCS', round: 'cs', lenKey: 'al-cs' }, // CORREGIDO
        { key: 'nlCSWinner', name: 'NLCS', round: 'cs', lenKey: 'nl-cs' }, // CORREGIDO
        { key: 'worldSeriesWinner', name: 'World Series', round: 'ws', lenKey: 'ws-winner' }, // CORREGIDO
      ];

      finalSeriesMapping.forEach(map => {
        const playerPick = player[map.key];
        const clavePick = claveEntry[map.key];
        // CORREGIDO: Buscar con guion
        const playerLength = player.seriesLengths?.[map.lenKey];
        const claveLength = claveEntry.seriesLengths?.[map.lenKey];
        let points = 0;
        if (playerPick && clavePick && playerPick === clavePick) {
          points += pointRules[map.round].winner;
          if (playerLength && claveLength && playerLength === claveLength) {
            points += pointRules[map.round].length;
          }
        }
        totalPoints += points;
        const reportArray = map.round === 'ws' ? reportData.final : reportData.cs;
        reportArray.push({ name: map.name, playerPick, playerLength, clavePick, claveLength, points });
      });
      
      reportData.final.push({ name: 'MVP', playerPick: player.worldSeriesMVP, clavePick: claveEntry.worldSeriesMVP, points: 0 });
      reportData.final.push({ name: 'Tie-Breaker', playerPick: player.tieBreakerScore.join(' - '), clavePick: claveEntry.tieBreakerScore.join(' - '), points: 0 });

      return { ...player, totalPoints, reportData };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async function buildReport() {
    try {
      const response = await fetch("/api/jugadas");
      if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);
      const allJugadas = await response.json();
      reportContainer.innerHTML = "";
      if (allJugadas.length < 2) {
        reportContainer.innerHTML = `<p class="loading-message">Se necesitan al menos 2 jugadas (incluyendo la "CLAVE") para generar el reporte.</p>`;
        return;
      }
      const processedPlayers = processAllJugadas(allJugadas);
      processedPlayers.forEach(playerData => {
        const cardHTML = createPlayerReportCard(playerData);
        reportContainer.innerHTML += cardHTML;
      });
    } catch (error) {
      console.error("Error building report:", error);
      reportContainer.innerHTML = `<p class="loading-message">No se pudo cargar el reporte. ${error.message}</p>`;
    }
  }

  buildReport();
});
