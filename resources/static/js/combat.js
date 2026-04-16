/**
 * combat.js
 * Lógica de combate local para Celestial Fury.
 * Funciona sin servidor WebSocket.
 * Cada ataque hace daño aleatorio, el oponente responde automáticamente.
 */

// ── Configuración de ataques ─────────────────────────────────────
const ATTACKS = {
  punch: {
    name: 'Flower Punch',
    icon: 'assets/images/icons/flower-punch.svg',
    sound: 'assets/sounds/Puño.wav',
    minDmg: 8,
    maxDmg: 15,
    cooldown: 800
  },
  kick: {
    name: 'Flower Kick',
    icon: 'assets/images/icons/flower-kick.svg',
    sound: 'assets/sounds/Patada.wav',
    minDmg: 12,
    maxDmg: 20,
    cooldown: 1200
  },
  beam: {
    name: 'Flower Beam',
    icon: 'assets/images/icons/flower-beam.svg',
    sound: 'assets/sounds/Explosion.wav',
    minDmg: 20,
    maxDmg: 30,
    cooldown: 2500
  }
};

// ── Estado del combate ───────────────────────────────────────────
const CombatState = {
  playerHP: 100,
  opponentHP: 100,
  ended: false,
  cooldowns: { punch: false, kick: false, beam: false },

  reset() {
    this.playerHP    = 100;
    this.opponentHP  = 100;
    this.ended       = false;
    this.cooldowns   = { punch: false, kick: false, beam: false };
  }
};

// ── Utilidades ───────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playSound(src) {
  try { new Audio(src).play(); } catch (e) {}
}

// ── Actualizar barra de HP ───────────────────────────────────────
function setHP(target, hp) {
  hp = Math.max(0, Math.min(100, hp));
  if (target === 'player')   CombatState.playerHP   = hp;
  if (target === 'opponent') CombatState.opponentHP = hp;

  const fillId = target === 'player' ? 'playerHealthFill'   : 'opponentHealthFill';
  const textId = target === 'player' ? 'playerHealthText'   : 'opponentHealthText';
  const fill   = document.getElementById(fillId);
  const text   = document.getElementById(textId);

  if (fill) {
    fill.style.width = hp + '%';
    fill.style.background =
      hp <= 25 ? 'linear-gradient(90deg,#ff0000,#ff5555)' :
      hp <= 50 ? 'linear-gradient(90deg,#ff8800,#ffbb44)' :
      target === 'player'
        ? 'linear-gradient(90deg,#D5006D,#FFB6E1)'
        : 'linear-gradient(90deg,#0077A8,#ADD8E6)';
  }
  if (text) text.textContent = hp + ' / 100';

  // Sacudir la sección al recibir daño
  const sectionClass = target === 'player' ? '.player-1' : '.player-2';
  const section = document.querySelector(sectionClass);
  if (section) {
    section.classList.add('anim-shake');
    setTimeout(() => section.classList.remove('anim-shake'), 400);
  }

  if (hp === 0 && !CombatState.ended) endGame(target);
}

// ── Mostrar efecto de ataque en la arena ─────────────────────────
function showAttackEffect(attackKey, fromPlayer) {
  const arena  = document.getElementById('battleEffects');
  if (!arena) return;

  const attack = ATTACKS[attackKey];
  const effect = document.createElement('div');
  effect.className = 'attack-effect ' + (fromPlayer ? 'from-player' : 'from-opponent');
  effect.innerHTML = `<img src="${attack.icon}" alt="${attack.name}">`;
  arena.appendChild(effect);

  // Efecto de explosión adicional
  const explosion = document.createElement('div');
  explosion.className = 'explosion-effect';
  explosion.innerHTML = `<img src="assets/images/icons/explosion-effect.svg" alt="boom">`;
  arena.appendChild(explosion);

  setTimeout(() => { effect.remove(); explosion.remove(); }, 700);
}

// ── Mostrar texto de daño flotante ───────────────────────────────
function showDamageNumber(target, dmg) {
  const sectionClass = target === 'player' ? '.player-1' : '.player-2';
  const section = document.querySelector(sectionClass);
  if (!section) return;

  const el = document.createElement('div');
  el.className = 'damage-number';
  el.textContent = '-' + dmg;
  section.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ── Actualizar status de batalla ─────────────────────────────────
function setBattleStatus(msg) {
  const el = document.getElementById('battleStatus');
  if (el) el.textContent = msg;
}

// ── Ataque del jugador ───────────────────────────────────────────
function playerAttack(attackKey) {
  if (CombatState.ended) return;
  if (CombatState.cooldowns[attackKey]) return;

  const attack = ATTACKS[attackKey];
  const dmg    = randInt(attack.minDmg, attack.maxDmg);

  // Cooldown del botón
  CombatState.cooldowns[attackKey] = true;
  const btn = document.getElementById('btn-' + attackKey);
  if (btn) {
    btn.classList.add('on-cooldown');
    btn.disabled = true;
    setTimeout(() => {
      CombatState.cooldowns[attackKey] = false;
      btn.classList.remove('on-cooldown');
      btn.disabled = false;
    }, attack.cooldown);
  }

  playSound(attack.sound);
  showAttackEffect(attackKey, true);
  showDamageNumber('opponent', dmg);
  setBattleStatus(`⚡ ${attack.name} — ${dmg} de daño!`);
  setHP('opponent', CombatState.opponentHP - dmg);

  // El oponente responde después de un breve delay
  if (!CombatState.ended) {
    setTimeout(opponentAttack, randInt(600, 1400));
  }
}

// ── Ataque automático del oponente ───────────────────────────────
function opponentAttack() {
  if (CombatState.ended) return;

  const keys   = Object.keys(ATTACKS);
  const key    = keys[randInt(0, keys.length - 1)];
  const attack = ATTACKS[key];
  const dmg    = randInt(attack.minDmg - 3, attack.maxDmg - 3); // oponente hace un poco menos daño

  playSound(attack.sound);
  showAttackEffect(key, false);
  showDamageNumber('player', dmg);
  setBattleStatus(`💥 ¡Oponente usó ${attack.name}!`);
  setHP('player', CombatState.playerHP - dmg);
}

// ── Fin del juego ────────────────────────────────────────────────
function endGame(loser) {
  CombatState.ended = true;

  const playerName = localStorage.getItem('playerName') || 'Jugador';
  const playerWon  = loser === 'opponent';

  playSound('assets/sounds/Ganador.wav');

  setTimeout(() => {
    const modal   = document.getElementById('gameOverModal');
    const title   = document.getElementById('gameOverTitle');
    const message = document.getElementById('gameOverMessage');
    if (!modal) return;

    if (playerWon) {
      title.textContent   = '🏆 ¡VICTORIA!';
      title.style.color   = '#FFD700';
      message.textContent = `Ganador: ${playerName}`;
    } else {
      title.textContent   = '💔 DERROTA';
      title.style.color   = '#ff6b9d';
      message.textContent = `Ganador: Oponente`;
    }

    modal.classList.add('show');
  }, 600);
}

// ── Construir los botones de ataque ──────────────────────────────
function buildAttackButtons() {
  const container = document.getElementById('controller-container');
  if (!container) return;

  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'attack-buttons';

  Object.entries(ATTACKS).forEach(([key, atk]) => {
    const btn = document.createElement('button');
    btn.id        = 'btn-' + key;
    btn.className = 'attack-btn attack-btn--' + key;
    btn.innerHTML = `
      <img src="${atk.icon}" alt="${atk.name}" class="attack-btn-icon">
      <span class="attack-btn-name">${atk.name}</span>
    `;
    btn.addEventListener('click', () => playerAttack(key));
    wrapper.appendChild(btn);
  });

  container.appendChild(wrapper);
}

// ── Inicializar al cargar ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildAttackButtons();
  setBattleStatus('¡Selecciona un ataque para comenzar!');
});

// Inicialización completada — modo multijugador activo