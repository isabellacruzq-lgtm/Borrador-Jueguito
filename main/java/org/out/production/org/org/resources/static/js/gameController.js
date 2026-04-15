/**
 * @fileoverview Controlador del Juego - Versión "Las Chicas Superpoderosas"
 * Orquesta la lógica del juego y la comunicación entre componentes
 * Sigue principio SOLID: Dependency Injection, Interface Segregation
 * @author Celestial Fury Team
 */

class GameController {
  /**
   * @param {string} gameContainerId - ID del contenedor del juego
   * @param {string} controllerContainerId - ID del contenedor del controlador
   * @param {SocketClient} socketClient - Cliente WebSocket
   * @param {CharacterManager} characterManager - Gestor de personajes
   */
  constructor(gameContainerId, controllerContainerId, socketClient, characterManager) {
    this.gameContainer = Utils.getElementById(gameContainerId);
    this.controllerContainer = Utils.getElementById(controllerContainerId);
    this.socketClient = socketClient;
    this.characterManager = characterManager;

    this.virtualController = null;
    this.gameState = 'waiting'; // waiting, playing, ended

    // Listas de IDs de personajes
    this.playerCharacters = [];
    this.opponentCharacters = [];

    // Referencias a constantes (asegúrate de que GAME_CONFIG esté en constants.js)
    this.playerHealth = 100;
    this.opponentHealth = 100;
    this.observers = [];

    this._setupGame();
  }

  /**
   * Configura el juego inicial
   * @private
   */
  _setupGame() {
    this._setupSocketListeners();
    // No llamamos a _createGameUI() porque el HTML ya existe en game.html
    this._initializeControllers();
    this._updateBattleStatus('Esperando oponente...');
  }

  /**
   * Configura los listeners del WebSocket para el Backend
   * @private
   */
  _setupSocketListeners() {
    // Escucha el inicio de partida desde el servidor
    this.socketClient.on(MESSAGE_TYPES.GAME_START, (data) => {
      this._handleGameStart(data);
    });

    // Escucha cuando alguien recibe daño
    this.socketClient.on(MESSAGE_TYPES.PLAYER_HIT, (data) => {
      this._handleHealthUpdate(data);
    });

    // Escucha el final de la partida
    this.socketClient.on(MESSAGE_TYPES.GAME_END, (data) => {
      this._handleGameEnd(data);
    });
  }

  /**
   * Inicializa el mando de flores (VirtualController)
   * @private
   */
  _initializeControllers() {
    if (!this.controllerContainer) {
      Utils.log('Contenedor del controlador no encontrado', 'error');
      return;
    }

    // El ID debe ser 'controller-container' según tu game.html
    this.virtualController = new VirtualController(
      this.controllerContainer.id,
      this.socketClient
    );

    // Suscribirse a eventos del mando
    this.virtualController.subscribe((event) => {
      if (event.type === 'attack') {
        this._handleLocalAttack(event.data);
      }
    });
  }

  /**
   * Actualiza los visuales de las Chicas en pantalla
   * @private
   */
  _updateCharacterDisplays() {
    const playerDisplay = Utils.getElementById('#playerDisplay');
    const opponentDisplay = Utils.getElementById('#opponentDisplay');

    if (!playerDisplay || !opponentDisplay) return;

    // Limpiar y llenar equipo local
    playerDisplay.innerHTML = '';
    this.playerCharacters.forEach(id => {
      const char = CHARACTERS[id.toUpperCase()] || this.characterManager.getCharacterInfo(id);
      if (char) {
        const el = Utils.createElement('div', { class: 'character-miniature' }, `
          <div class="mini-icon" style="background-color: ${char.color}">${char.emoji}</div>
          <span>${char.name}</span>
        `);
        playerDisplay.appendChild(el);
      }
    });

    // Limpiar y llenar equipo oponente
    opponentDisplay.innerHTML = '';
    this.opponentCharacters.forEach(id => {
      const char = CHARACTERS[id.toUpperCase()] || this.characterManager.getCharacterInfo(id);
      if (char) {
        const el = Utils.createElement('div', { class: 'character-miniature' }, `
          <div class="mini-icon" style="background-color: ${char.color}">${char.emoji}</div>
          <span>${char.name}</span>
        `);
        opponentDisplay.appendChild(el);
      }
    });
  }

  /**
   * Maneja el inicio de la partida
   * @private
   */
  _handleGameStart(data) {
    this.gameState = 'playing';
    this.playerCharacters = data.playerCharacters || [];
    this.opponentCharacters = data.opponentCharacters || [];

    this._updateCharacterDisplays();
    this._updateBattleStatus('¡LAS PODEROSAS AL ATAQUE!');
    this.virtualController.enable();

    Utils.log('Partida iniciada', 'info');
    this._notifyObservers('gameStart', data);
  }

  /**
   * Actualiza la vida sincronizada con el backend
   * @private
   */
  _handleHealthUpdate(data) {
    // data.target: 'player' o 'opponent'
    // data.newHealth: valor numérico
    if (data.target === 'player') {
      this.playerHealth = data.newHealth;
      this._updateHealthBar('player', this.playerHealth);
      this._animateImpact('player');
    } else {
      this.opponentHealth = data.newHealth;
      this._updateHealthBar('opponent', this.opponentHealth);
      this._animateImpact('opponent');
    }

    Utils.playSound('assets/sounds/hit.mp3');
  }

  /**
   * Actualiza las barras de vida usando los IDs de game.html
   * @private
   */
  _updateHealthBar(target, health) {
    const fill = Utils.getElementById(target === 'player' ? '#playerHealthFill' : '#opponentHealthFill');
    const text = Utils.getElementById(target === 'player' ? '#playerHealthText' : '#opponentHealthText');

    if (fill) fill.style.width = `${health}%`;
    if (text) text.textContent = `${health} / 100`;
  }

  /**
   * Lógica para cuando el usuario local ataca
   * @private
   */
  _handleLocalAttack(attackData) {
    // Emitir al servidor el ataque
    this.socketClient.send(MESSAGE_TYPES.PLAYER_ATTACK, {
      attackId: attackData.id,
      timestamp: Date.now()
    });

    // Feedback visual local
    this._showAttackEffect(attackData.emoji || '⚡');
    Utils.log(`Atacando con: ${attackData.name}`, 'info');
  }

  /**
   * Crea un efecto visual de ataque en el medio de la arena
   * @private
   */
  _showAttackEffect(emoji) {
    const arena = Utils.getElementById('#battleEffects');
    if (!arena) return;

    const effect = Utils.createElement('div', { class: 'attack-particle' }, emoji);
    arena.appendChild(effect);

    setTimeout(() => effect.remove(), 1000);
  }

  /**
   * Animación de sacudida al recibir daño
   * @private
   */
  async _animateImpact(target) {
    const section = Utils.getElementById(target === 'player' ? '.player-1' : '.player-2');
    if (section) {
      section.classList.add('shake-animation');
      await Utils.delay(500);
      section.classList.remove('shake-animation');
    }
  }

  _updateBattleStatus(message) {
    const status = Utils.getElementById('#battleStatus');
    if (status) status.textContent = message;
  }

  _handleGameEnd(data) {
    this.gameState = 'ended';
    this.virtualController.disable();

    const modal = Utils.getElementById('#gameOverModal');
    const title = Utils.getElementById('#gameOverTitle');
    const msg = Utils.getElementById('#gameOverMessage');

    if (modal) {
      title.textContent = data.winner === this.socketClient.getPlayerId() ? '¡VICTORIA!' : 'DERROTA';
      msg.textContent = data.message || 'La batalla ha terminado.';
      modal.classList.add('show');
    }

    this._notifyObservers('gameEnd', data);
  }

  // ... Métodos de Observer (subscribe, notify) iguales a tu original ...
  subscribe(callback) {
    this.observers.push(callback);
    return () => this.observers = this.observers.filter(cb => cb !== callback);
  }

  _notifyObservers(type, data) {
    this.observers.forEach(cb => cb({ type, data }));
  }
}