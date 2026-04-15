/**
 * animations.js
 * Sistema de animaciones visuales de combate para Celestial Fury.
 * Incluye: efecto explosivo flotante, onda circular pulsante,
 * parpadeo blanco en enemigos, partículas de color, texto flotante de score/combo.
 *
 * Uso:
 *   AnimationSystem.showAttackFloat('💥', container);
 *   AnimationSystem.showWavePulse(container);
 *   AnimationSystem.flashWhite(enemyElement);
 *   AnimationSystem.spawnParticles(x, y, container, '#FF69B4');
 *   AnimationSystem.showFloatingText('+150', x, y, container, false);
 *   AnimationSystem.showComboText('x4 COMBO!', x, y, container);
 */

class AnimationSystem {
  // ─── Constantes de partículas ────────────────────────────────
  static PARTICLE_COUNT   = 12;
  static PARTICLE_EMOJIS  = ['✨', '⭐', '💫', '🌟'];
  static COMBO_THRESHOLDS = [
    { min: 3,  label: 'COMBO!',         color: '#FFD700' },
    { min: 5,  label: 'SÚPER COMBO!!',  color: '#FF6B00' },
    { min: 8,  label: '¡IMPARABLE!!!',  color: '#FF0055' },
    { min: 12, label: '¡¡LEGENDARIO!!', color: '#CC00FF' }
  ];

  // ─────────────────────────────────────────────────────────────
  // 1. EFECTO EXPLOSIVO FLOTANTE  (emoji del personaje + boom)
  //    Muestra el emoji del personaje dentro de una explosión
  //    animada que sube y se desvanece.
  //
  //    @param {string}      emoji     - emoji del personaje que ataca (💥⚡🔥🌀)
  //    @param {HTMLElement} container - elemento donde se monta el efecto
  //    @param {string}      [side]    - 'left' | 'right' (de qué lado aparece)
  // ─────────────────────────────────────────────────────────────
  static showAttackFloat(emoji, container, side = 'center') {
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className  = `anim-attack-float anim-attack-float--${side}`;
    wrap.innerHTML  = `
      <div class="anim-burst">💥</div>
      <div class="anim-char-emoji">${emoji}</div>
    `;
    container.appendChild(wrap);
    setTimeout(() => wrap.remove(), 900);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ONDA CIRCULAR PULSANTE
  //    Aparece en el centro del container y se expande.
  //
  //    @param {HTMLElement} container
  //    @param {string}      [color]  - color de la onda (CSS color)
  // ─────────────────────────────────────────────────────────────
  static showWavePulse(container, color = '#FF69B4') {
    if (!container) return;

    const wave = document.createElement('div');
    wave.className = 'anim-wave-pulse';
    wave.style.setProperty('--wave-color', color);
    container.appendChild(wave);
    setTimeout(() => wave.remove(), 700);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. PARPADEO BLANCO EN EL ENEMIGO
  //    Hace que el elemento parpadee tres veces en blanco
  //    al recibir daño.
  //
  //    @param {HTMLElement} enemyElement
  // ─────────────────────────────────────────────────────────────
  static flashWhite(enemyElement) {
    if (!enemyElement) return;
    enemyElement.classList.add('anim-hit-flash');
    setTimeout(() => enemyElement.classList.remove('anim-hit-flash'), 500);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. PARTÍCULAS DE COLOR  (al golpear o destruir un enemigo)
  //    Genera N partículas que salen desde (x, y) en el container.
  //
  //    @param {number}      x         - posición X relativa al container
  //    @param {number}      y         - posición Y relativa al container
  //    @param {HTMLElement} container
  //    @param {string}      color     - color principal de las partículas
  //    @param {boolean}     [burst]   - true → más partículas (para destruir)
  // ─────────────────────────────────────────────────────────────
  static spawnParticles(x, y, container, color = '#FF69B4', burst = false) {
    if (!container) return;

    const count = burst
      ? AnimationSystem.PARTICLE_COUNT * 2
      : AnimationSystem.PARTICLE_COUNT;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'anim-particle';

      // Ángulo y velocidad aleatorios
      const angle    = Math.random() * 360;
      const distance = 30 + Math.random() * (burst ? 90 : 55);
      const rad      = (angle * Math.PI) / 180;
      const dx       = Math.cos(rad) * distance;
      const dy       = Math.sin(rad) * distance;
      const size     = burst ? 8 + Math.random() * 8 : 5 + Math.random() * 6;
      const isEmoji  = Math.random() < 0.3;

      p.style.cssText = `
        left: ${x}px;
        top:  ${y}px;
        --dx: ${dx}px;
        --dy: ${dy}px;
        background: ${isEmoji ? 'transparent' : color};
        width:  ${size}px;
        height: ${size}px;
        font-size: ${size + 2}px;
        border-radius: ${Math.random() < 0.5 ? '50%' : '20%'};
      `;
      if (isEmoji) {
        p.textContent = AnimationSystem.PARTICLE_EMOJIS[
          Math.floor(Math.random() * AnimationSystem.PARTICLE_EMOJIS.length)
        ];
      }

      container.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. TEXTO FLOTANTE DE PUNTUACIÓN
  //    Muestra "+150" o similares sobre el enemigo golpeado.
  //
  //    @param {string}      text
  //    @param {number}      x
  //    @param {number}      y
  //    @param {HTMLElement} container
  //    @param {string}      [color]
  // ─────────────────────────────────────────────────────────────
  static showFloatingText(text, x, y, container, color = '#FFD700') {
    if (!container) return;

    const el = document.createElement('div');
    el.className  = 'anim-floating-text';
    el.textContent = text;
    el.style.cssText = `left:${x}px; top:${y}px; color:${color};`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. TEXTO DE COMBO  (se muestra según umbral de combo)
  //    Usa COMBO_THRESHOLDS para elegir el texto y color.
  //
  //    @param {number}      comboCount  - cantidad de golpes consecutivos
  //    @param {number}      x
  //    @param {number}      y
  //    @param {HTMLElement} container
  // ─────────────────────────────────────────────────────────────
  static showComboText(comboCount, x, y, container) {
    if (!container || comboCount < 3) return;

    // Buscar el umbral más alto que cumpla
    const thresh = [...AnimationSystem.COMBO_THRESHOLDS]
      .reverse()
      .find(t => comboCount >= t.min);
    if (!thresh) return;

    const el = document.createElement('div');
    el.className  = 'anim-combo-text';
    el.textContent = `x${comboCount} ${thresh.label}`;
    el.style.cssText = `
      left: ${x}px;
      top:  ${y - 30}px;
      color: ${thresh.color};
      --combo-color: ${thresh.color};
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER  — dispara todos los efectos de un ataque conectado
  //    Llama a showWavePulse + showAttackFloat + spawnParticles
  //    + showFloatingText en una sola llamada conveniente.
  //
  //    @param {object} opts
  //      - container  {HTMLElement}
  //      - emoji      {string}    emoji del personaje
  //      - x, y       {number}   posición de impacto
  //      - damage     {number}
  //      - color      {string}   color del personaje
  //      - combo      {number}
  //      - side       {string}   'left'|'right'|'center'
  //      - destroy    {boolean}  si el enemigo fue destruido
  //      - enemyEl    {HTMLElement} elemento del enemigo para flash
  // ─────────────────────────────────────────────────────────────
  static playHitFX(opts = {}) {
    const {
      container, emoji = '⚡', x = 100, y = 100,
      damage = 0, color = '#FF69B4', combo = 0,
      side = 'center', destroy = false, enemyEl = null
    } = opts;

    AnimationSystem.showWavePulse(container, color);
    AnimationSystem.showAttackFloat(emoji, container, side);
    if (enemyEl) AnimationSystem.flashWhite(enemyEl);
    AnimationSystem.spawnParticles(x, y, container, color, destroy);

    if (damage > 0) {
      const dmgColor = destroy ? '#FF3300' : '#FFD700';
      AnimationSystem.showFloatingText(`-${damage}`, x, y - 20, container, dmgColor);
    }
    if (combo >= 3) {
      AnimationSystem.showComboText(combo, x, y - 50, container);
    }
  }
}
