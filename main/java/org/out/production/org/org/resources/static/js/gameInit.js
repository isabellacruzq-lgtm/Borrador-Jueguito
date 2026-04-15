/**
 * gameInit.js
 * - Carga personajes seleccionados desde localStorage
 * - Monitorea HP y muestra pantalla de ganador cuando llega a 0
 */

const CHARACTER_IMAGES = {
  bombon:  'assets/images/characters/bombon-character.png',
  burbuja: 'assets/images/characters/burbuja-character.png',
  bellota: 'assets/images/characters/bellota-character.png',
  brisa:   'assets/images/characters/brisa-character.png'
};

// Estado de HP actual
let playerHP   = 100;
let opponentHP = 100;
let gameEnded  = false;

/**
 * Construye la miniatura de un personaje con su imagen real
 */
function buildCharacterMiniature(characterId) {
  const id   = characterId.toLowerCase();
  const key  = id.toUpperCase();
  const data = (typeof CHARACTERS !== 'undefined' && CHARACTERS[key]) || {};
  const name  = data.name  || id;
  const color = data.color || '#ccc';
  const img   = CHARACTER_IMAGES[id];

  const visual = img
    ? `<img src="${img}" alt="${name}" class="mini-img">`
    : `<div class="mini-icon" style="background-color:${color}">${data.emoji || '⚡'}</div>`;

  return `
    <div class="character-miniature">
      <div class="mini-avatar" style="border-color:${color}">${visual}</div>
      <span class="mini-name">${name}</span>
    </div>
  `;
}

/**
 * Renderiza los personajes del jugador local
 */
function initGameCharacters() {
  const playerDisplay   = document.getElementById('playerDisplay');
  const opponentDisplay = document.getElementById('opponentDisplay');
  if (!playerDisplay || !opponentDisplay) return;

  // Personajes propios desde localStorage
  let playerChars = [];
  try {
    playerChars = JSON.parse(localStorage.getItem('playerCharacters') || '[]');
  } catch (e) {}

  playerDisplay.innerHTML = playerChars.length
    ? playerChars.map(buildCharacterMiniature).join('')
    : '<p class="no-chars">Sin personajes seleccionados</p>';

  // Oponente: puntos animados hasta que se conecte
  opponentDisplay.innerHTML = `
    <div class="waiting-opponent">
      <div class="waiting-dots"><span></span><span></span><span></span></div>
      <p>Esperando oponente...</p>
    </div>
  `;
}

/**
 * Renderiza los personajes del oponente (llamar cuando se conecte)
 */
function renderOpponentCharacters(ids) {
  const opponentDisplay = document.getElementById('opponentDisplay');
  if (!opponentDisplay || !ids || ids.length === 0) return;
  opponentDisplay.innerHTML = ids.map(buildCharacterMiniature).join('');
}

/**
 * Muestra la pantalla de ganador
 * @param {string} winnerName - Nombre del ganador
 * @param {boolean} isLocalWinner - true si ganó el jugador local
 */
function showWinnerScreen(winnerName, isLocalWinner) {
  if (gameEnded) return;
  gameEnded = true;

  const modal   = document.getElementById('gameOverModal');
  const title   = document.getElementById('gameOverTitle');
  const message = document.getElementById('gameOverMessage');

  if (!modal || !title || !message) return;

  if (isLocalWinner) {
    title.textContent   = '🏆 ¡VICTORIA!';
    message.textContent = `Ganador: ${winnerName}`;
    title.style.color   = '#FFD700';
  } else {
    title.textContent   = '💔 DERROTA';
    message.textContent = `Ganador: ${winnerName}`;
    title.style.color   = '#ff6b9d';
  }

  modal.classList.add('show');
}

/**
 * Actualiza la barra de HP y detecta si llegó a 0
 * @param {'player'|'opponent'} target
 * @param {number} newHP - valor entre 0 y 100
 */
function updateHP(target, newHP) {
  const hp = Math.max(0, Math.min(100, newHP));

  const fillId = target === 'player' ? 'playerHealthFill'  : 'opponentHealthFill';
  const textId = target === 'player' ? 'playerHealthText'  : 'opponentHealthText';

  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);

  if (fill) fill.style.width = hp + '%';
  if (text) text.textContent = hp + ' / 100';

  if (target === 'player')   playerHP   = hp;
  if (target === 'opponent') opponentHP = hp;

  // ── Cambiar color de barra según HP ─────────────────────────
  if (fill) {
    if (hp <= 25) {
      fill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
    } else if (hp <= 50) {
      fill.style.background = 'linear-gradient(90deg, #ff8800, #ffaa44)';
    }
    // el color original lo pone el CSS
  }

  // ── Detectar fin de juego ────────────────────────────────────
  if (!gameEnded) {
    const playerName = localStorage.getItem('playerName') || 'Jugador';

    if (target === 'player' && hp === 0) {
      // El jugador local perdió → el oponente ganó
      showWinnerScreen('Oponente', false);
    } else if (target === 'opponent' && hp === 0) {
      // El oponente perdió → el jugador local ganó
      showWinnerScreen(playerName, true);
    }
  }
}

// ── Inicializar al cargar ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initGameCharacters);
