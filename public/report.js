document.addEventListener("DOMContentLoaded", function () {
  const reportContainer = document.getElementById("report-container");

  const pointRules = {
    wc: { winner: 2, length: 1 },
    ds: { winner: 4, length: 2 },
    cs: { winner: 8, length: 3 },
    ws: { winner: 16, length: 4 },
  };

  function createComparisonRow(seriesName, playerPick, playerLength, clavePick, claveLength, points) {
    const winnerMatch = playerPick && clavePick && playerPick === clavePick;
    const lengthMatch = playerLength && claveLength && playerLength === claveLength;
    return `
      <tr>
        <td>${seriesName}</td>
        <td>${playerPick || 'N/A'}</td>
        <td>${playerLength || '?'}</td>
        <td>${clavePick || 'N/A'}</td>
        <td>${claveLength || '?'}</td>
        <td class="${winnerMatch ? 'match-yes' : 'match-no'}">${winnerMatch ? 'Yes' : 'No'}</td>
        <td class="${winnerMatch && lengthMatch ? 'match-yes' : 'match-no'}">${winnerMatch && lengthMatch ? 'Yes' : 'No'}</td>
        <td class="points-cell">${points}</td>
      </tr>
    `;
  }

  function createPlayerReportCard(playerData) {
    const { name, totalPoints, reportData } = playerData;
    const createTableForRound = (title, seriesArray) => {
      return `
        <div class="round-report">
          <h3>${title}</h3>
          <table class="report-table">
            <thead><tr><th>Serie</th><th>Tu Pick</th><th>Juegos</th><th>Pick CLAVE</th><th>Juegos</th><th>Acertó Ganador</th><th>Acertó Juegos</th><th>Puntos</th></tr></thead>
            <tbody>${seriesArray.map(s => createComparisonRow(s.name, s.playerPick, s.playerLength, s.clavePick, s.claveLength, s.points)).join('')}</tbody>
          </table>
        </div>
      `;
    };
    return `
      <div class="player-report-card">
        <div class="player-header"><h2>${name || 'Jugador Anónimo'}</h2><div class="total-score">${totalPoints} Puntos</div></div>
        ${createTableForRound("Wild Card Series", reportData.wc)}
        ${createTableForRound("Division Series", reportData.ds)}
        ${createTableForRound("Championship Series", reportData.cs)}
        ${createTableForRound("Finals", reportData.final)}
      </div>
    `;
  }
  
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
        { key: 'alWCWinners', prefix: 'ALWC', round: 'wc', lenPrefix: 'al_wc' },
        { key: 'nlWCWinners', prefix: 'NLWC', round: 'wc', lenPrefix: 'nl_wc' },
        { key: 'alDSWinners', prefix: 'ALDS', round: 'ds', lenPrefix: 'al_ds' },
        { key: 'nlDSWinners', prefix: 'NLDS', round: 'ds', lenPrefix: 'nl_ds' },
      ];

      seriesMapping.forEach(map => {
        (player[map.key] || []).forEach((playerPick, i) => {
          const clavePick = (claveEntry[map.key] || [])[i];
          // CORREGIDO: Buscar con guión bajo
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
        { key: 'alCSWinner', name: 'ALCS', round: 'cs', lenKey: 'al_cs' },
        { key: 'nlCSWinner', name: 'NLCS', round: 'cs', lenKey: 'nl_cs' },
        { key: 'worldSeriesWinner', name: 'World Series', round: 'ws', lenKey: 'ws' },
      ];

      finalSeriesMapping.forEach(map => {
        const playerPick = player[map.key];
        const clavePick = claveEntry[map.key];
        // CORREGIDO: Buscar con guión bajo
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
