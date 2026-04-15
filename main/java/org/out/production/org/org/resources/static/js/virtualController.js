/**
 * @fileoverview Controlador Virtual - Mando con botones de flores
 * Maneja la interfaz de controles del jugador
 * Sigue principio SOLID: Open/Closed Principle
 * @author Celestial Fury Team
 */

/**
 * Controlador Virtual - Implementa interfaz de flores para atacar
 * @class
 */
class VirtualController {
  /**
   * Constructor
   * @param {string} containerId - ID del contenedor
   * @param {SocketClient} socketClient - Cliente WebSocket
   */
  constructor(containerId, socketClient) {
    this.containerId = containerId;
    this.socketClient = socketClient;
    this.container = Utils.getElementById(containerId);
    this.isPunching = false;
    this.observers = [];
    this._initializeController();
  }

  /**
   * Inicializa el controlador
   * @private
   */
  _initializeController() {
    if (!this.container) {
      Utils.log(`Contenedor no encontrado: ${this.containerId}`,'error');
      return;
    }

    this.container.innerHTML = '';
    this._createFlowerButtons();
    this._attachEventListeners();
  }

  /**
   * Crea los botones de flores
   * @private
   */
  _createFlowerButtons() {
    const flowerContainer = Utils.createElement('div', {
      class: 'flower-container',
      id: 'flowerContainer'
    });

    const attacks = [
      { id: 'punch-left', name: 'Golpe Izquierdo', position: 'left' },
      { id: 'punch-center', name: 'Golpe Centro', position: 'center' },
      { id: 'punch-right', name: 'Golpe Derecho', position: 'right' }
    ];

    attacks.forEach(attack => {
      const flowerBtn = this._createFlowerButton(attack);
      flowerContainer.appendChild(flowerBtn);
    });

    this.container.appendChild(flowerContainer);
  }

  /**
   * Crea un botón de flor individual
   * @private
   * @param {Object} attack - Configuración del ataque
   * @returns {Element} Botón de flor
   */
  _createFlowerButton(attack) {
    const button = Utils.createElement('button', {
      class: 'flower-button',
      id: attack.id,
      'data-attack': attack.position,
      'data-name': attack.name,
      'aria-label': attack.name
    });

    // SVG de flor con pétalos
    const flowerSVG = `
      <svg class="flower-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Centro de la flor -->
        <circle cx="50" cy="50" r="15" class="flower-center" fill="currentColor"/>

        <!-- Pétalos -->
        <ellipse cx="50" cy="20" rx="12" ry="20" class="flower-petal" fill="currentColor" opacity="0.9"/>
        <ellipse cx="80" cy="30" rx="12" ry="20" class="flower-petal" fill="currentColor" opacity="0.9" transform="rotate(60 50 50)"/>
        <ellipse cx="80" cy="70" rx="12" ry="20" class="flower-petal" fill="currentColor" opacity="0.9" transform="rotate(120 50 50)"/>
        <ellipse cx="50" cy="80" rx="12" ry="20" class="flower-petal" fill="currentColor" opacity="0.9" transform="rotate(180 50 50)"/>
        <ellipse cx="20" cy="70" rx="12" ry="20" class="flower-petal" fill="currentColor" opacity="0.9" transform="rotate(240 50 50)"/>
        <ellipse cx="20" cy="30" rx="12" ry="20" class="flower-petal" fill="currentColor" opacity="0.9" transform="rotate(300 50 50)"/>
      </svg>
    `;

    button.innerHTML = flowerSVG + `<span class="flower-label">${attack.name}</span>`;

    // Asignar color según el ataque
    const colors = ['#FFB6E1', '#ADD8E6', '#90EE90'];
    button.style.setProperty('--flower-color', colors[Math.floor(Math.random() * colors.length)]);

    return button;
  }

  /**
   * Adjunta listeners de eventos
   * @private
   */
  _attachEventListeners() {
    const flowerButtons = Utils.getElements('.flower-button');

    flowerButtons.forEach(button => {
      button.addEventListener('click', (e) => this._handleAttack(e));
      button.addEventListener('touchstart', (e) => this._handleAttack(e), { passive: false });
      button.addEventListener('mouseenter', () => this._highlightButton(button));
      button.addEventListener('mouseleave', () => this._unhighlightButton(button));
    });
  }

  /**
   * Maneja el ataque de flor
   * @private
   * @param {Event} event - Evento del click
   */
  async _handleAttack(event) {
    event.preventDefault();

    if (this.isPunching) {
      return; // Evitar múltiples golpes simultáneos
    }

    const button = event.currentTarget;
    const attackPosition = button.getAttribute('data-attack');
    const attackName = button.getAttribute('data-name');

    this.isPunching = true;

    try {
      // Animar el botón
      await this._animatePunch(button);

      // Enviar ataque al servidor
      this.socketClient.send({
        type: MESSAGE_TYPES.ATTACK,
        position: attackPosition,
        name: attackName,
        timestamp: Date.now()
      });

      // Reproducir sonido
      Utils.playSound('assets/sounds/punch.mp3');

      // Notificar observadores
      this._notifyObservers('attack', { position: attackPosition, name: attackName });

      Utils.log(`Ataque enviado: ${attackName}`,'info');

    } catch (error) {
      Utils.log(`Error en ataque: ${error.message}`,'error');
    } finally {
      this.isPunching = false;
    }
  }

  /**
   * Anima el golpe de la flor
   * @private
   * @param {Element} button - Botón a animar
   * @returns {Promise}
   */
  async _animatePunch(button) {
    // Agregar clase de animación
    await Utils.addClass(button, 'punch-active', 0);

    // Crear efecto de línea de golpe
    const punchLine = Utils.createElement('div', {
      class: 'punch-line',
      style: {
        left: button.offsetLeft + button.offsetWidth / 2 + 'px',
        top: button.offsetTop + button.offsetHeight / 2 + 'px'
      }
    });

    this.container.appendChild(punchLine);

    // Esperar a que termine la animación
    await Utils.delay(ANIMATION_CONFIG.PUNCH_DURATION);

    // Remover clases y efectos
    Utils.removeClass(button, 'punch-active');
    if (punchLine.parentNode) {
      punchLine.parentNode.removeChild(punchLine);
    }
  }

  /**
   * Resalta un botón
   * @private
   * @param {Element} button - Botón a resaltar
   */
  _highlightButton(button) {
    Utils.addClass(button, 'flower-highlight');
  }

  /**
   * Quita el resalte de un botón
   * @private
   * @param {Element} button - Botón a desresaltar
   */
  _unhighlightButton(button) {
    Utils.removeClass(button, 'flower-highlight');
  }

  /**
   * Disabilita los controles
   */
  disable() {
    const buttons = Utils.getElements('.flower-button');
    buttons.forEach(btn => {
      btn.disabled = true;
      Utils.addClass(btn, 'disabled');
    });
  }

  /**
   * Habilita los controles
   */
  enable() {
    const buttons = Utils.getElements('.flower-button');
    buttons.forEach(btn => {
      btn.disabled = false;
      Utils.removeClass(btn, 'disabled');
    });
  }

  /**
   * Se suscribe a eventos
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a observadores
   * @private
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Datos del evento
   */
  _notifyObservers(eventType, data) {
    this.observers.forEach(callback => {
      try {
        callback({ type: eventType, data });
      } catch (error) {
        Utils.log(`Error en observador: ${error.message}`,'error');
      }
    });
  }

  /**
   * Limpia el controlador
   */
  destroy() {
    this.container.innerHTML = '';
    this.observers = [];
  }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualController;
}