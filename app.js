let games = JSON.parse(localStorage.getItem('games')) || [];
let editIndex = null;
let sortKey = '';
let sortDir = 1;

const gameForm = document.getElementById('gameForm');
const gameList = document.getElementById('gameList');
const cancelEditBtn = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');

function renderGames() {
  const filtered = games.filter(g => filterGame(g));
  gameList.innerHTML = '';
  filtered.forEach((game, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${game.title}</td>
      <td>${game.platform}</td>
      <td>${game.year}</td>
      <td>${game.rating}</td>
      <td>${game.tag}</td>
      <td class="actions">
        <button onclick="editGame(${index})">Edytuj</button>
        <button onclick="deleteGame(${index})">Usuń</button>
      </td>`;
    gameList.appendChild(row);
  });
  localStorage.setItem('games', JSON.stringify(games));
  updateStats(filtered);
}

function editGame(index) {
  const game = games[index];
  document.getElementById('title').value = game.title;
  document.getElementById('platform').value = game.platform;
  document.getElementById('year').value = game.year;
  document.getElementById('rating').value = game.rating;
  document.getElementById('tag').value = game.tag;
  editIndex = index;
  formTitle.textContent = 'Edytuj grę';
  cancelEditBtn.style.display = 'inline';
}

function deleteGame(index) {
  if (confirm('Czy na pewno chcesz usunąć tę grę?')) {
    games.splice(index, 1);
    renderGames();
  }
}

cancelEditBtn.addEventListener('click', () => {
  gameForm.reset();
  editIndex = null;
  formTitle.textContent = 'Dodaj nową grę';
  cancelEditBtn.style.display = 'none';
});

gameForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const platform = document.getElementById('platform').value;
  const year = parseInt(document.getElementById('year').value);
  const rating = parseInt(document.getElementById('rating').value);
  const tag = document.getElementById('tag').value;

  const newGame = { title, platform, year, rating, tag };
  if (editIndex !== null) {
    games[editIndex] = newGame;
    editIndex = null;
    formTitle.textContent = 'Dodaj nową grę';
    cancelEditBtn.style.display = 'none';
  } else {
    games.push(newGame);
  }

  gameForm.reset();
  renderGames();
});

document.getElementById('search').addEventListener('input', renderGames);

function filterGame(game) {
  const q = document.getElementById('search').value.toLowerCase();
  return Object.values(game).some(val => String(val).toLowerCase().includes(q));
}

function sortTable(key) {
  sortDir = sortKey === key ? -sortDir : 1;
  sortKey = key;
  games.sort((a, b) => (a[key] > b[key] ? sortDir : -sortDir));
  renderGames();
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

function exportToXLSX() {
  const ws = XLSX.utils.json_to_sheet(games);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Games");
  XLSX.writeFile(wb, "games.xlsx");
}

document.getElementById("importFile").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    games = XLSX.utils.sheet_to_json(sheet);
    renderGames();
  };
  reader.readAsArrayBuffer(file);
});

function exportToJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", "games.json");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

document.getElementById("importJson").addEventListener("change", function(e) {
  const reader = new FileReader();
  reader.onload = function(e) {
    games = JSON.parse(e.target.result);
    renderGames();
  };
  reader.readAsText(e.target.files[0]);
});

function updateStats(list) {
  document.getElementById("gameCount").textContent = `Liczba gier: ${list.length}`;
  const avg = list.length ? (list.reduce((sum, g) => sum + g.rating, 0) / list.length).toFixed(2) : 0;
  document.getElementById("avgRating").textContent = `Średnia ocen: ${avg}`;
  if (window.myChart) window.myChart.destroy();
  const tags = {};
  list.forEach(g => tags[g.tag] = (tags[g.tag] || 0) + 1);
  const ctx = document.getElementById("chart").getContext("2d");
  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(tags),
      datasets: [{
        label: "Liczba gier wg oznaczeń",
        data: Object.values(tags),
        backgroundColor: "#007bff"
      }]
    }
  });
}

renderGames();
window.editGame = editGame;
window.deleteGame = deleteGame;
window.sortTable = sortTable;
window.exportToXLSX = exportToXLSX;
window.exportToJSON = exportToJSON;
window.toggleDarkMode = toggleDarkMode;