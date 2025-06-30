document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#results-table tbody");

  /**
   * Fetches prediction data from the API and displays it in the table.
   */
  async function fetchAndDisplayResults() {
    try {
      // Fetch the data from our new API endpoint
      const response = await fetch("/api/jugadas");
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const jugadas = await response.json();

      // Clear the "Loading..." message from the table
      tableBody.innerHTML = "";

      if (jugadas.length === 0) {
        // Show a message if there are no predictions yet
        tableBody.innerHTML = `<tr><td colspan="6" class="loading-cell">No se han encontrado predicciones todavía.</td></tr>`;
        return;
      }

      // Loop through each prediction and create a table row
      jugadas.forEach((jugada) => {
        const row = document.createElement("tr");

        // Format the submission date for better readability
        const submittedDate = new Date(jugada.submittedAt).toLocaleString("es-PR", {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        });

        row.innerHTML = `
          <td>${jugada.name || 'N/A'}</td>
          <td>${jugada.worldSeriesWinner || 'N/A'}</td>
          <td>${jugada.worldSeriesMVP || 'N/A'}</td>
          <td>${jugada.seriesLengths?.ws || '?'}</td>
          <td>${(jugada.tieBreakerScore ?? ['?','?']).join(' - ')}</td>
          <td>${submittedDate}</td>
        `;

        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error("Error al cargar los resultados:", error);
      // Display an error message in the table
      tableBody.innerHTML = `<tr><td colspan="6" class="loading-cell">No se pudieron cargar los resultados. Inténtalo de nuevo más tarde.</td></tr>`;
    }
  }

  // Run the function to load the data when the page opens
  fetchAndDisplayResults();
});
