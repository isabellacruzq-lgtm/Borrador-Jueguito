/**
 * enemies.js
 * Obstáculos temáticos de Las Chicas Superpoderosas.
 * Define los 6 tipos de enemigo y la clase EnemyManager
 * que gestiona la aparición y ciclo de vida en pantalla.
 *
 * Integración con combat.js / gameController.js:
 *   const mgr = new EnemyManager('battleEffects', difficulty);
 *   mgr.spawnWave();
 *   mgr.onEnemyHit  = (enemy, x, y) => { ... };  // callback de golpe
 *   mgr.onEnemyDead = (enemy, x, y) => { ... };  // callback de muerte
 */

// ── Definiciones de los 6 tipos de enemigo ──────────────────────
const ENEMY_TYPES = {
  MOJO_JOJO: {
    id:          'mojo_jojo',
    name:        'Mojo Jojo',
    emoji:       '🐒',
    maxHp:       3,
    damage:      [15, 25],   // [min, max]
    speed:       1.0,        // multiplicador de velocidad base
    points:      300,
    color:       '#6B3A8B',
    description: 'El archienemigo cerebral. Golpe moderado.'
  },
  FUZZY: {
    id:          'fuzzy',
    name:        'Aluza Pelusa',
    emoji:       '🦠',
    maxHp:       2,
    damage:      [8, 16],
    speed:       1.8,        // rápido y ágil
    points:      200,
    color:       '#FF69B4',
    description: 'Veloz e irritante. Pocas vidas pero esquivo.'
  },
  HIM: {
    id:          'him',
    name:        'H.I.M.',
    emoji:       '👹',
    maxHp:       5,
    damage:      [20, 35],
    speed:       0.8,
    points:      500,
    color:       '#CC0000',
    description: 'El enemigo más peligroso. Mucha vida y daño alto.'
  },
  ROACH: {
    id:          'roach',
    name:        'Cucaracha Mutante',
    emoji:       '🪲',
    maxHp:       1,
    damage:      [5, 12],
    speed:       2.0,        // muy rápido pero frágil
    points:      50,
    color:       '#556B2F',
    description: 'Enemigo básico. Un solo golpe las elimina.'
  },
  GANG: {
    id:          'gang',
    name:        'Pandilla',
    emoji:       '😈',
    maxHp:       2,
    damage:      [10, 18],
    speed:       1.3,
    points:      150,
    color:       '#FF8C00',
    description: 'Dificultad media. Aparecen en grupos.'
  },
  BOMB: {
    id:          'bomb',
    name:        'Bomba',
    emoji:       '💣',
    maxHp:       1,
    damage:      [30, 40],   // daño de explosión al contacto
    speed:       1.5,
    points:      100,
    color:       '#333333',
    explodes:    true,       // hace daño en área al morir/contactar
    blastRadius: 80,         // px de radio de explosión
    description: 'Explota al contacto. ¡Mantenla alejada!'
  }
};

// ── Configuración de oleadas por dificultad ──────────────────────
// Se importan los valores de DifficultyManager (difficulty.js)
const WAVE_TEMPLATES = {
  EASY: [
    ['ROACH', 'ROACH', 'GANG'],
    ['ROACH', 'ROACH', 'ROACH', 'GANG'],
    ['GANG', 'GANG', 'FUZZY'],
    ['MOJO_JOJO', 'ROACH', 'ROACH']
  ],
  NORMAL: [
    ['ROACH', 'ROACH', 'GANG', 'GANG'],
    ['FUZZY', 'FUZZY', 'GANG', 'ROACH'],
    ['MOJO_JOJO', 'GANG', 'BOMB'],
    ['HIM', 'ROACH', 'ROACH'],
    ['HIM', 'MOJO_JOJO', 'BOMB']
  ],
  HARD: [
    ['ROACH', 'ROACH', 'GANG', 'GANG', 'BOMB'],
    ['FUZZY', 'FUZZY', 'FUZZY', 'GANG', 'BOMB'],
    ['MOJO_JOJO', 'MOJO_JOJO', 'GANG', 'BOMB'],
    ['HIM', 'MOJO_JOJO', 'FUZZY', 'BOMB'],
    ['HIM', 'HIM', 'BOMB', 'BOMB']
  ]
};

// ─────────────────────────────────────────────────────────────────
// Clase Enemy  — representa una instancia de enemigo en juego
// ─────────────────────────────────────────────────────────────────
class Enemy {
  /**
   * @param {string} typeKey    - clave de ENEMY_TYPES (p.ej. 'HIM')
   * @param {object} difficulty - objeto de DifficultyManager.current
   */
  constructor(typeKey, difficulty = { damageMultiplier: 1.0, speed: 1.0 }) {
    const def        = ENEMY_TYPES[typeKey];
    if (!def) throw new Error(`Tipo de enemigo desconocido: ${typeKey}`);

    this.typeKey     = typeKey;
    this.id          = def.id;
    this.name        = def.name;
    this.emoji       = def.emoji;
    this.maxHp       = def.maxHp;
    this.hp          = def.maxHp;
    this.color       = def.color;
    this.points      = def.points;
    this.explodes    = def.explodes || false;
    this.blastRadius = def.blastRadius || 0;
    this.description = def.description;

    // Escalar según dificultad
    const dmgMin     = def.damage[0];
    const dmgMax     = def.damage[1];
    this.minDamage   = Math.round(dmgMin * difficulty.damageMultiplier);
    this.maxDamage   = Math.round(dmgMax * difficulty.damageMultiplier);
    this.speed       = def.speed * difficulty.speed;

    // Elemento DOM (asignado por EnemyManager al crear el sprite)
    this.element     = null;
    this.alive       = true;
  }

  /** Devuelve un valor de daño aleatorio para este turno */
  rollDamage() {
    return Math.floor(Math.random() * (this.maxDamage - this.minDamage + 1)) + this.minDamage;
  }

  /**
   * Aplica daño al enemigo.
   * @param {number} amount
   * @returns {{ died: boolean, remaining: number }}
   */
  takeDamage(amount) {
    if (!this.alive) return { died: false, remaining: 0 };

    this.hp = Math.max(0, this.hp - amount);
    this._updateHpBar();

    if (this.hp === 0) {
      this.alive = false;
      return { died: true, remaining: 0 };
    }
    return { died: false, remaining: this.hp };
  }

  /** Sincroniza la barra de HP visual del sprite */
  _updateHpBar() {
    if (!this.element) return;
    const bar = this.element.querySelector('.enemy-hp-fill');
    if (bar) bar.style.width = `${(this.hp / this.maxHp) * 100}%`;
  }

  /** Genera el sprite DOM para este enemigo */
  buildElement() {
    const el        = document.createElement('div');
    el.className    = `enemy-sprite enemy--${this.id}`;
    el.dataset.type = this.typeKey;
    el.style.setProperty('--enemy-color', this.color);

    el.innerHTML = `
      <div class="enemy-emoji">${this.emoji}</div>
      <div class="enemy-name">${this.name}</div>
      <div class="enemy-hp-bar">
        <div class="enemy-hp-fill" style="width:100%; background:${this.color};"></div>
      </div>
    `;

    this.element = el;
    return el;
  }
}

// ─────────────────────────────────────────────────────────────────
// Clase EnemyManager  — gestiona la arena de enemigos
// ─────────────────────────────────────────────────────────────────
class EnemyManager {
  /**
   * @param {string} arenaId    - ID del contenedor de batalla (p.ej. 'battleEffects')
   * @param {string} difficulty - 'EASY' | 'NORMAL' | 'HARD'
   */
  constructor(arenaId, difficulty = 'NORMAL') {
    this.arena       = document.getElementById(arenaId);
    this.difficulty  = difficulty;
    this.diffCfg     = (typeof DIFFICULTIES !== 'undefined')
                         ? DIFFICULTIES[difficulty]
                         : { damageMultiplier: 1.0, speed: 1.0 };

    this.enemies     = [];    // Enemy[] activos
    this.waveIndex   = 0;
    this.waveTemplates = WAVE_TEMPLATES[difficulty] || WAVE_TEMPLATES.NORMAL;

    // Callbacks públicos — asignar desde fuera
    /** @type {function(Enemy, number, number): void} */
    this.onEnemyHit  = null;
    /** @type {function(Enemy, number, number): void} */
    this.onEnemyDead = null;
    /** @type {function(Enemy): void} */
    this.onPlayerHit = null;   // cuando un enemigo alcanza al jugador
  }

  // ── Genera la siguiente oleada ─────────────────────────────
  spawnWave() {
    const template = this.waveTemplates[this.waveIndex % this.waveTemplates.length];
    this.waveIndex++;

    template.forEach((typeKey, i) => {
      setTimeout(() => this._spawnOne(typeKey), i * 350);
    });
  }

  // ── Crea y monta un enemigo en la arena ───────────────────
  _spawnOne(typeKey) {
    if (!this.arena) return;

    const enemy = new Enemy(typeKey, this.diffCfg);
    const el    = enemy.buildElement();

    // Posición aleatoria en la arena
    const arenaW = this.arena.offsetWidth  || 600;
    const arenaH = this.arena.offsetHeight || 200;
    el.style.left = `${20 + Math.random() * (arenaW - 100)}px`;
    el.style.top  = `${20 + Math.random() * (arenaH - 60)}px`;

    // Clic/tap para atacar al enemigo manualmente (modo demo)
    el.addEventListener('click', (e) => {
      this._handleEnemyClick(enemy, e.clientX, e.clientY);
    });

    this.arena.appendChild(el);
    this.enemies.push(enemy);

    // Animación de entrada
    el.classList.add('enemy-enter');
    setTimeout(() => el.classList.remove('enemy-enter'), 500);
  }

  // ── Procesa un golpe sobre un enemigo ─────────────────────
  /**
   * @param {Enemy}  enemy
   * @param {number} damage
   * @param {number} [hitX] - X de impacto relativa al arena (para FX)
   * @param {number} [hitY]
   */
  hitEnemy(enemy, damage, hitX, hitY) {
    if (!enemy || !enemy.alive) return;

    const rect = enemy.element?.getBoundingClientRect();
    const arenaBCR = this.arena?.getBoundingClientRect();
    const x = hitX ?? (rect && arenaBCR ? rect.left - arenaBCR.left + rect.width / 2 : 100);
    const y = hitY ?? (rect && arenaBCR ? rect.top  - arenaBCR.top  + rect.height / 2 : 100);

    const { died } = enemy.takeDamage(damage);

    if (died) {
      this._killEnemy(enemy, x, y);
    } else {
      if (this.onEnemyHit) this.onEnemyHit(enemy, x, y);
    }
  }

  // ── Elimina un enemigo de la arena ────────────────────────
  _killEnemy(enemy, x, y) {
    if (this.onEnemyDead) this.onEnemyDead(enemy, x, y);

    // Si explota, notificar para que combat.js aplique daño en área
    if (enemy.explodes) {
      this._triggerExplosion(enemy, x, y);
    }

    // Animación de muerte
    if (enemy.element) {
      enemy.element.classList.add('enemy-die');
      setTimeout(() => enemy.element?.remove(), 500);
    }

    this.enemies = this.enemies.filter(e => e !== enemy);
  }

  /** Notifica la explosión de una bomba a los alrededores */
  _triggerExplosion(bomb, x, y) {
    this.enemies.forEach(other => {
      if (!other.alive || other === bomb) return;
      const otherRect   = other.element?.getBoundingClientRect();
      const arenaBCR    = this.arena?.getBoundingClientRect();
      if (!otherRect || !arenaBCR) return;
      const ox = otherRect.left - arenaBCR.left + otherRect.width / 2;
      const oy = otherRect.top  - arenaBCR.top  + otherRect.height / 2;
      const dist = Math.hypot(ox - x, oy - y);
      if (dist <= bomb.blastRadius) {
        this.hitEnemy(other, Math.round(bomb.rollDamage() * 0.5), ox, oy);
      }
    });
  }

  // ── Click directo sobre un sprite (modo demo/prueba) ──────
  _handleEnemyClick(enemy, clientX, clientY) {
    const rect    = this.arena?.getBoundingClientRect();
    const x       = rect ? clientX - rect.left : 100;
    const y       = rect ? clientY - rect.top  : 100;
    this.hitEnemy(enemy, 1, x, y);  // 1 de daño por click (los personajes dan su propio daño)
  }

  // ── Devuelve todos los enemigos vivos ─────────────────────
  getAlive() {
    return this.enemies.filter(e => e.alive);
  }

  /** true si no queda ningún enemigo vivo */
  isWaveClear() {
    return this.getAlive().length === 0;
  }

  /** Elimina todos los sprites del DOM */
  clearArena() {
    this.enemies.forEach(e => e.element?.remove());
    this.enemies = [];
  }

  /** Cambia la dificultad en caliente */
  setDifficulty(level) {
    this.difficulty     = level;
    this.diffCfg        = (typeof DIFFICULTIES !== 'undefined')
                            ? DIFFICULTIES[level]
                            : { damageMultiplier: 1.0, speed: 1.0 };
    this.waveTemplates  = WAVE_TEMPLATES[level] || WAVE_TEMPLATES.NORMAL;
    this.waveIndex      = 0;
  }
}
