/**
 * controls.js
 * Controles de teclado para dos jugadores locales en Celestial Fury.
 *
 * Jugador 1 (izquierda):
 *   Movimiento : W A S D
 *   Ataque     : Z
 *   Especial   : X  (se carga con combos)
 *
 * Jugador 2 (derecha):
 *   Movimiento : ↑ ← ↓ →  (ArrowUp/Left/Down/Right)
 *   Ataque     : Shift  (ShiftLeft o ShiftRight)
 *   Especial   : ñ / Ñ  (código de tecla 'Semicolon' en distribución ES)
 *
 * Uso básico:
 *   const controls = new MultiplayerControls({
 *     p1: {
 *       onMove:    (dir) => { ... },  // 'up'|'down'|'left'|'right'|null
 *       onAttack:  ()    => { ... },
 *       onSpecial: ()    => { ... }
 *     },
 *     p2: {
 *       onMove:    (dir) => { ... },
 *       onAttack:  ()    => { ... },
 *       onSpecial: ()    => { ... }
 *     }
 *   });
 *   controls.enable();
 *   // ... para destruir:
 *   controls.disable();
 */

// ── Mapas de teclas ──────────────────────────────────────────────
const P1_KEYS = {
  KeyW:        'up',
  KeyA:        'left',
  KeyS:        'down',
  KeyD:        'right',
  KeyZ:        'attack',
  KeyX:        'special'
};

const P2_KEYS = {
  ArrowUp:     'up',
  ArrowLeft:   'left',
  ArrowDown:   'down',
  ArrowRight:  'right',
  ShiftLeft:   'attack',
  ShiftRight:  'attack',    // ambos Shift funcionan
  Semicolon:   'special',   // tecla Ñ en distribución española
  IntlRo:      'special'    // alternativa en algunos teclados ES
};

// ─────────────────────────────────────────────────────────────────
// Clase ComboTracker  — lleva la cuenta de golpes consecutivos
//   y calcula si el especial está disponible.
// ─────────────────────────────────────────────────────────────────
class ComboTracker {
  /**
   * @param {object} opts
   *   - decayMs       {number}  tiempo sin atacar para resetear (ms) — desde difficulty.js
   *   - specialCharge {number}  golpes necesarios para cargar el especial
   */
  constructor({ decayMs = 3000, specialCharge = 5 } = {}) {
    this.count         = 0;
    this.specialReady  = false;
    this.decayMs       = decayMs;
    this.specialCharge = specialCharge;
    this._decayTimer   = null;
  }

  /** Registra un golpe y devuelve el conteo actual */
  hit() {
    clearTimeout(this._decayTimer);
    this.count++;

    if (this.count >= this.specialCharge) {
      this.specialReady = true;
    }

    this._decayTimer = setTimeout(() => this.reset(), this.decayMs);
    return this.count;
  }

  /**
   * Consume el especial si está cargado.
   * @returns {boolean} true si se pudo usar
   */
  useSpecial() {
    if (!this.specialReady) return false;
    this.reset();
    return true;
  }

  /** Reinicia el combo */
  reset() {
    clearTimeout(this._decayTimer);
    this.count        = 0;
    this.specialReady = false;
  }

  /** Configura el tiempo de decaimiento (para cambiar dificultad en caliente) */
  setDecay(ms) {
    this.decayMs = ms;
  }
}

// ─────────────────────────────────────────────────────────────────
// Clase MultiplayerControls
// ─────────────────────────────────────────────────────────────────
class MultiplayerControls {
  /**
   * @param {object} callbacks
   *   - p1 { onMove, onAttack, onSpecial, onCombo }
   *   - p2 { onMove, onAttack, onSpecial, onCombo }
   * @param {object} [opts]
   *   - comboDecayMs    {number} (por defecto 3000, viene de DifficultyManager)
   *   - specialCharge   {number} golpes para cargar el especial (por defecto 5)
   *   - preventDefaults {boolean} evita scroll con teclas de flecha (por defecto true)
   */
  constructor(callbacks = {}, opts = {}) {
    this._p1cb   = callbacks.p1 || {};
    this._p2cb   = callbacks.p2 || {};

    const decayMs       = opts.comboDecayMs  ?? 3000;
    const specialCharge = opts.specialCharge ?? 5;

    this.combo1  = new ComboTracker({ decayMs, specialCharge });
    this.combo2  = new ComboTracker({ decayMs, specialCharge });

    this._preventDefaults = opts.preventDefaults !== false;
    this._enabled         = false;
    this._held            = new Set();   // teclas actualmente presionadas

    // Refs de listener para poder eliminarlos luego
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
  }

  // ── Activar / desactivar ───────────────────────────────────
  enable() {
    if (this._enabled) return;
    this._enabled = true;
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);
  }

  disable() {
    this._enabled = false;
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup',   this._onKeyUp);
    this._held.clear();
    this.combo1.reset();
    this.combo2.reset();
  }

  // ── Actualiza decay de combo si cambia la dificultad ──────
  setComboDecay(ms) {
    this.combo1.setDecay(ms);
    this.combo2.setDecay(ms);
  }

  // ── Listener de keydown ────────────────────────────────────
  _onKeyDown(e) {
    if (!this._enabled) return;
    const code = e.code;

    // Evitar repetición de tecla mantenida
    if (this._held.has(code)) return;
    this._held.add(code);

    // Bloquear scroll con flechas / espacio
    if (this._preventDefaults &&
        ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code)) {
      e.preventDefault();
    }

    // ── Jugador 1 ───────────────────────────────────────────
    const p1action = P1_KEYS[code];
    if (p1action) {
      if (p1action === 'attack') {
        const combo = this.combo1.hit();
        this._cb(this._p1cb.onAttack);
        this._cb(this._p1cb.onCombo, combo);
      } else if (p1action === 'special') {
        const ok = this.combo1.useSpecial();
        if (ok) this._cb(this._p1cb.onSpecial);
      } else {
        this._cb(this._p1cb.onMove, p1action);
      }
    }

    // ── Jugador 2 ───────────────────────────────────────────
    const p2action = P2_KEYS[code];
    if (p2action) {
      if (p2action === 'attack') {
        const combo = this.combo2.hit();
        this._cb(this._p2cb.onAttack);
        this._cb(this._p2cb.onCombo, combo);
      } else if (p2action === 'special') {
        const ok = this.combo2.useSpecial();
        if (ok) this._cb(this._p2cb.onSpecial);
      } else {
        this._cb(this._p2cb.onMove, p2action);
      }
    }
  }

  // ── Listener de keyup ──────────────────────────────────────
  _onKeyUp(e) {
    this._held.delete(e.code);

    // Notificar stop de movimiento
    const p1action = P1_KEYS[e.code];
    if (p1action && !['attack','special'].includes(p1action)) {
      this._cb(this._p1cb.onMove, null);
    }
    const p2action = P2_KEYS[e.code];
    if (p2action && !['attack','special'].includes(p2action)) {
      this._cb(this._p2cb.onMove, null);
    }
  }

  // ── Helper: llama un callback solo si existe ───────────────
  _cb(fn, ...args) {
    if (typeof fn === 'function') fn(...args);
  }

  // ── Info de estado ─────────────────────────────────────────
  getComboState() {
    return {
      p1: { count: this.combo1.count, specialReady: this.combo1.specialReady },
      p2: { count: this.combo2.count, specialReady: this.combo2.specialReady }
    };
  }

  /** Genera y monta una leyenda de controles en un contenedor */
  static renderControlsLegend(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="controls-legend">
        <div class="controls-player">
          <h4>🎮 Jugador 1</h4>
          <ul>
            <li>Mover   : <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></li>
            <li>Atacar  : <kbd>Z</kbd></li>
            <li>Especial: <kbd>X</kbd> <span class="tip">(carga con combos)</span></li>
          </ul>
        </div>
        <div class="controls-divider">VS</div>
        <div class="controls-player">
          <h4>🕹️ Jugador 2</h4>
          <ul>
            <li>Mover   : <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></li>
            <li>Atacar  : <kbd>Shift</kbd></li>
            <li>Especial: <kbd>Ñ</kbd> <span class="tip">(carga con combos)</span></li>
          </ul>
        </div>
      </div>
    `;
  }
}
