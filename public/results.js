document.addEventListener("DOMContentLoaded", function () {
  const adminPanel = document.getElementById("admin-panel");
  const adminForm = document.getElementById("admin-form");
  const urlParams = new URLSearchParams(window.location.search);
  const adminKey = urlParams.get('key');

  // --- ADMIN PANEL LOGIC ---

  function showAdminPanel(correctResults) {
    if (!adminPanel) return;
    adminPanel.style.display = "block";
    const allTeams = [ "New York Yankees", "Baltimore Orioles", "Cleveland Guardians", "Seattle Mariners", "Houston Astros", "Minnesota Twins", "Los Angeles Dodgers", "Milwaukee Brewers", "Philadelphia Phillies", "Atlanta Braves", "Chicago Cubs", "San Diego Padres" ];
    
    const seriesData = [
      // ... (series data remains the same)
    ];
    
    // Add the MVP input to the World Series admin section
    const wsContainer = document.getElementById('admin-ws');
    if (wsContainer) {
        // ... (existing code to build WS matchup)

        // NEW: Add MVP input
        const mvpDiv = document.createElement('div');
        mvpDiv.className = 'admin-matchup';
        mvpDiv.innerHTML = `
            <label>Correct World Series MVP</label>
            <input type="text" id="correct-mvp" placeholder="Nombre del Jugador">
        `;
        wsContainer.appendChild(mvpDiv);
        if (correctResults.worldSeriesMVP) {
            document.getElementById('correct-mvp').value = correctResults.worldSeriesMVP;
        }
    }
    
    adminForm.addEventListener("submit", handleAdminFormSubmit);
  }

  async function handleAdminFormSubmit(e) {
      e.preventDefault();
      const resultsToSave = { winners: {}, seriesLengths: {} };
      
      // ... (existing logic for series winners and lengths)

      // NEW: Get the correct MVP value
      const mvpInput = document.getElementById('correct-mvp');
      if (mvpInput && mvpInput.value) {
          resultsToSave.worldSeriesMVP = mvpInput.value;
      }

      try {
          const response = await fetch(`/api/set-results?key=${adminKey}`, { /* ... */ });
          // ... (rest of the function)
      } catch (error) { /* ... */ }
  }

  // ... (rest of the file remains the same)
});
