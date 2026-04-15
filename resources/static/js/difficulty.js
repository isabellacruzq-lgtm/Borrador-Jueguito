/**
 * difficulty.js
 * Niveles de dificultad para Celestial Fury.
 * Define tres modos: Fácil, Normal y Difícil, con sus
 * parámetros de velocidad, cantidad de enemigos, restauración
 * de HP y multiplicador de daño.
 *
 * Uso:
 *   const dm = new DifficultyManager();
 *   dm.set('HARD');
 *   const cfg = dm.get();          // { label, speed, ... }
 *   dm.showSelector('my-div-id'); // monta la UI de selección
 *   dm.onChange = (level, cfg) => { ... };
 */

// ── Tabla de dificultades ────────────────────────────────────────
const DIFFICULTIES = {
  EASY: {
    key:               'EASY',
    label:             '🟢 Fácil',
    description:       'Velocidad reducida, pocos enemigos y más HP al subir nivel.',
    speed:             0.6,   // multiplicador de velocidad del enemigo
    enemyCount:        0.5,   // fracción de enemigos en cada oleada
    hpRestore:         20,    // HP restaurado al completar una oleada
    damageMultiplier:  0.7,   // daño de los enemigos × este factor
    scoreMultiplier:   0.8,   // puntos obtenidos × este factor
    comboDecay:        4000,  // ms antes de que el combo se resetee
    spawnInterval:     3000,  // ms entre oleadas
    uiColor:           '#4CAF50'
  },
  NORMAL: {
    key:               'NORMAL',
    label:             '🟡 Normal',
    description:       'Mecánicas completas y balanceadas.',
    speed:             1.0,
    enemyCount:        1.0,
    hpRestore:         10,
    damageMultiplier:  1.0,
    scoreMultiplier:   1.0,
    comboDecay:        3000,
    spawnInterval:     2000,
    uiColor:           '#FFC107'
  },
  HARD: {
    key:               'HARD',
    label:             '🔴 Difícil',
    description:       'Enemigos rápidos, más numerosos y con más HP.',
    speed:             1.5,
    enemyCount:        1.8,
    hpRestore:         5,
    damageMultiplier:  1.3,
    scoreMultiplier:   1.5,
    comboDecay:        2000,
    spawnInterval:     1200,
    uiColor:           '#F44336'
  }
};

// ─────────────────────────────────────────────────────────────────
// Clase DifficultyManager
// ─────────────────────────────────────────────────────────────────
class DifficultyManager {
  constructor(defaultLevel = 'NORMAL') {
    this._current = defaultLevel;

    /** Callback opcional que se dispara al cambiar dificultad */
    this.onChange = null;   // function(level: string, config: object)
  }

  // ── Getters / setters ──────────────────────────────────────
  /** Devuelve el objeto de configuración actual */
  get() {
    return DIFFICULTIES[this._current];
  }

  /** Devuelve la clave actual ('EASY' | 'NORMAL' | 'HARD') */
  getKey() {
    return this._current;
  }

  /**
   * Cambia la dificultad activa.
   * @param {'EASY'|'NORMAL'|'HARD'} level
   */
  set(level) {
    if (!DIFFICULTIES[level]) {
      console.warn(`[DifficultyManager] Nivel desconocido: "${level}". Se usa NORMAL.`);
      level = 'NORMAL';
    }
    this._current = level;

    // Persistir en localStorage para que sobreviva recargas
    try { localStorage.setItem('cf_difficulty', level); } catch (_) {}

    if (this.onChange) this.onChange(level, DIFFICULTIES[level]);
    return this;
  }

  /** Carga la dificultad guardada en localStorage (si existe) */
  loadSaved() {
    try {
      const saved = localStorage.getItem('cf_difficulty');
      if (saved && DIFFICULTIES[saved]) this._current = saved;
    } catch (_) {}
    return this;
  }

  // ── Utilidades de configuración ────────────────────────────
  /**
   * Devuelve cuántos enemigos debería haber en una oleada base de N.
   * @param {number} baseCount
   */
  scaleEnemyCount(baseCount) {
    return Math.max(1, Math.round(baseCount * this.get().enemyCount));
  }

  /**
   * Escala el daño de un enemigo según la dificultad.
   * @param {number} rawDamage
   */
  scaleDamage(rawDamage) {
    return Math.round(rawDamage * this.get().damageMultiplier);
  }

  /**
   * Escala los puntos obtenidos.
   * @param {number} rawScore
   */
  scaleScore(rawScore) {
    return Math.round(rawScore * this.get().scoreMultiplier);
  }

  // ── UI: selector de dificultad ─────────────────────────────
  /**
   * Monta una interfaz de selección de dificultad dentro de un contenedor.
   * @param {string} containerId - ID del elemento padre
   */
  showSelector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[DifficultyManager] Contenedor "${containerId}" no encontrado.`);
      return;
    }

    container.innerHTML = '';

    const title = document.createElement('h3');
    title.className   = 'difficulty-title';
    title.textContent = 'Selecciona la dificultad';
    container.appendChild(title);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'difficulty-btn-group';

    Object.values(DIFFICULTIES).forEach(cfg => {
      const btn = document.createElement('button');
      btn.className     = `difficulty-btn difficulty-btn--${cfg.key.toLowerCase()}`;
      btn.dataset.level = cfg.key;
      btn.style.setProperty('--diff-color', cfg.uiColor);
      btn.innerHTML     = `
        <span class="diff-label">${cfg.label}</span>
        <span class="diff-desc">${cfg.description}</span>
      `;

      if (cfg.key === this._current) btn.classList.add('active');

      btn.addEventListener('click', () => {
        this.set(cfg.key);
        // Actualizar estados visuales
        btnGroup.querySelectorAll('.difficulty-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.level === cfg.key);
        });
      });

      btnGroup.appendChild(btn);
    });

    container.appendChild(btnGroup);
  }

  // ── Inyecta estilos de la UI de dificultad ─────────────────
  static injectStyles() {
    if (document.getElementById('cf-difficulty-styles')) return;

    const style = document.createElement('style');
    style.id = 'cf-difficulty-styles';
    style.textContent = `
      .difficulty-title {
        text-align: center;
        color: #FFB6E1;
        font-family: 'Press Start 2P', sans-serif;
        font-size: 0.85rem;
        margin-bottom: 12px;
        text-shadow: 0 0 8px #FF69B4;
      }
      .difficulty-btn-group {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .difficulty-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 16px;
        border: 2px solid var(--diff-color, #FF69B4);
        border-radius: 12px;
        background: rgba(0,0,0,0.5);
        color: #fff;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 110px;
      }
      .difficulty-btn:hover,
      .difficulty-btn.active {
        background: var(--diff-color, #FF69B4);
        box-shadow: 0 0 12px var(--diff-color, #FF69B4);
        transform: translateY(-2px);
      }
      .diff-label { font-size: 1rem; font-weight: bold; }
      .diff-desc  { font-size: 0.65rem; opacity: 0.85; text-align: center; }
    `;
    document.head.appendChild(style);
  }
}

// Auto-inyectar estilos cuando se carga el archivo
if (typeof document !== 'undefined') {
  DifficultyManager.injectStyles();
}
