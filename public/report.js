document.addEventListener("DOMContentLoaded", function () {
  const reportContainer = document.getElementById("report-container");

  /**
   * Creates a single row for a report table.
   * @param {string} seriesName - The name of the series (e.g., "AL Wild Card 1").
   * @param {string} predictedWinner - The team the player predicted to win.
   * @param {string} predictedLength - The number of games the player predicted.
   * @returns {string} - The HTML string for a table row.
   */
  function createTableRow(seriesName, predictedWinner, predictedLength) {
    return `
      <tr>
        <td>${seriesName}</td>
        <td>${predictedWinner || 'N/A'}</td>
        <td>${predictedLength || '?'}</td>
      </tr>
    `;
  }

  /**
   * Creates the complete HTML for a single player's report card.
   * @param {object} jugada - The prediction data for one player.
   * @returns {string} - The complete HTML string for the player's card.
   */
  function createPlayerReportCard(jugada) {
    const {
      name,
      alWCWinners = [], nlWCWinners = [],
      alDSWinners = [], nlDSWinners = [],
      alCSWinner, nlCSWinner,
      worldSeriesWinner,
      worldSeriesMVP,
      tieBreakerScore = [],
      seriesLengths = {}
    } = jugada;

    const wildCardReport = `
      <div class="round-report">
        <h3>Wild Card Series</h3>
        <table class="report-table">
          <thead><tr><th>Serie</th><th>Ganador Predicho</th><th>Juegos</th></tr></thead>
          <tbody>
            ${createTableRow("AL Wild Card 1", alWCWinners[0], seriesLengths.al_wc1)}
            ${createTableRow("AL Wild Card 2", alWCWinners[1], seriesLengths.al_wc2)}
            ${createTableRow("NL Wild Card 1", nlWCWinners[0], seriesLengths.nl_wc1)}
            ${createTableRow("NL Wild Card 2", nlWCWinners[1], seriesLengths.nl_wc2)}
          </tbody>
        </table>
      </div>
    `;

    const divisionSeriesReport = `
      <div class="round-report">
        <h3>Division Series</h3>
        <table class="report-table">
          <thead><tr><th>Serie</th><th>Ganador Predicho</th><th>Juegos</th></tr></thead>
          <tbody>
            ${createTableRow("AL Division Series 1", alDSWinners[0], seriesLengths.al_ds1)}
            ${createTableRow("AL Division Series 2", alDSWinners[1], seriesLengths.al_ds2)}
            ${createTableRow("NL Division Series 1", nlDSWinners[0], seriesLengths.nl_ds1)}
            ${createTableRow("NL Division Series 2", nlDSWinners[1], seriesLengths.nl_ds2)}
          </tbody>
        </table>
      </div>
    `;

    const championshipReport = `
      <div class="round-report">
        <h3>Championship Series</h3>
        <table class="report-table">
          <thead><tr><th>Serie</th><th>Ganador Predicho</th><th>Juegos</th></tr></thead>
          <tbody>
            ${createTableRow("American League", alCSWinner, seriesLengths.al_cs)}
            ${createTableRow("National League", nlCSWinner, seriesLengths.nl_cs)}
          </tbody>
        </table>
      </div>
    `;

    const finalPicksReport = `
      <div class="round-report final-picks-report">
        <h3>Final Picks</h3>
        <table class="report-table">
          <thead><tr><th>Categoría</th><th>Predicción</th><th>Juegos</th></tr></thead>
          <tbody>
            ${createTableRow("World Series Champion", worldSeriesWinner, seriesLengths.ws)}
            <tr><td>World Series MVP</td><td colspan="2">${worldSeriesMVP || 'N/A'}</td></tr>
            <tr><td>Tie-Breaker Score</td><td colspan="2">${tieBreakerScore.join(' - ')}</td></tr>
          </tbody>
        </table>
      </div>
    `;

    return `
      <div class="player-report-card">
        <div class="player-header">
          <h2>${name || 'Jugador Anónimo'}</h2>
        </div>
        <div class="report-grid">
          ${wildCardReport}
          ${divisionSeriesReport}
          ${championshipReport}
          ${finalPicksReport}
        </div>
      </div>
    `;
  }

  /**
   * Fetches all predictions and builds the report page.
   */
  async function buildReport() {
    try {
      const response = await fetch("/api/jugadas");
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const allJugadas = await response.json();

      // Clear the loading message
      reportContainer.innerHTML = "";

      if (allJugadas.length === 0) {
        reportContainer.innerHTML = `<p class="loading-message">No se han encontrado predicciones todavía.</p>`;
        return;
      }

      // Create and append a report card for each player
      allJugadas.forEach(jugada => {
        const cardHTML = createPlayerReportCard(jugada);
        reportContainer.innerHTML += cardHTML;
      });

    } catch (error) {
      console.error("Error building report:", error);
      reportContainer.innerHTML = `<p class="loading-message">No se pudo cargar el reporte. Inténtalo de nuevo más tarde.</p>`;
    }
  }

  // Run the main function to build the report
  buildReport();
});
