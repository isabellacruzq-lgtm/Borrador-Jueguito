/**
 * gameInit.js
 * Carga y muestra los personajes seleccionados en game.html
 * sin depender del WebSocket. Se ejecuta al cargar la página.
 */

// Mapa de imágenes por personaje
const CHARACTER_IMAGES = {
  bombon:  'assets/images/characters/bombon-character.png',
  burbuja: 'assets/images/characters/burbuja-character.png',
  bellota: 'assets/images/characters/bellota-character.png',
  brisa:   'assets/images/characters/brisa-character.png'
};

/**
 * Crea el HTML de una miniatura de personaje con su imagen real
 */
function buildCharacterMiniature(characterId) {
  const id  = characterId.toLowerCase();
  const key = id.toUpperCase();
  const data = (typeof CHARACTERS !== 'undefined' && CHARACTERS[key]) || {};

  const name  = data.name  || id;
  const color = data.color || '#ccc';
  const img   = CHARACTER_IMAGES[id];

  const visual = img
    ? `<img src="${img}" alt="${name}" class="mini-img">`
    : `<div class="mini-icon" style="background-color:${color}">${data.emoji || '⚡'}</div>`;

  return `
    <div class="character-miniature">
      <div class="mini-avatar" style="border-color:${color}">
        ${visual}
      </div>
      <span class="mini-name">${name}</span>
    </div>
  `;
}

/**
 * Renderiza los personajes del jugador y deja un placeholder para el oponente
 */
function initGameCharacters() {
  const playerDisplay   = document.getElementById('playerDisplay');
  const opponentDisplay = document.getElementById('opponentDisplay');
  if (!playerDisplay || !opponentDisplay) return;

  // --- Jugador local (del sessionStorage) ---
  let playerChars = [];
  try {
    playerChars = JSON.parse(localStorage.getItem('playerCharacters') || '[]');
  } catch (e) { /* vacío */ }

  if (playerChars.length === 0) {
    playerDisplay.innerHTML = '<p class="no-chars">Sin personajes seleccionados</p>';
  } else {
    playerDisplay.innerHTML = playerChars.map(buildCharacterMiniature).join('');
  }

  // --- Oponente (aún no conectado) ---
  opponentDisplay.innerHTML = `
    <div class="waiting-opponent">
      <div class="waiting-dots">
        <span></span><span></span><span></span>
      </div>
      <p>Esperando oponente...</p>
    </div>
  `;
}

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', initGameCharacters);

// También se puede llamar desde _handleGameStart cuando lleguen los datos del oponente:
// renderOpponentCharacters(['bombon', 'brisa']);
function renderOpponentCharacters(ids) {
  const opponentDisplay = document.getElementById('opponentDisplay');
  if (!opponentDisplay || !ids || ids.length === 0) return;
  opponentDisplay.innerHTML = ids.map(buildCharacterMiniature).join('');
}
