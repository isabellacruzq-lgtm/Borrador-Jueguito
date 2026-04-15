/**
 * @fileoverview Aplicación Principal - Punto de entrada
 * Orquesta la inicialización y comunicación entre módulos
 * Sigue principio SOLID: Facade Pattern
 * @author Celestial Fury Team
 */

/**
 * Clase principal de la aplicación
 * @class
 */
class CelestialFuryApp {
  /**
   * Constructor
   */
  constructor() {
    this.socketClient = null;
    this.characterManager = null;
    this.gameController = null;
    this.currentPage = 'index';
  }

  /**
   * Inicializa la aplicación
   * @returns {Promise}
   */
async initialize() {
// await this.socketClient.connect(); //
  try {
    this.socketClient = SocketClient.getInstance();

    // Intentamos conectar, pero si falla, seguimos para ver el diseño
    try {
      await this.socketClient.connect();
    } catch (connError) {
      console.warn("Servidor no detectado. Entrando en modo previsualización.");
    }

    this.characterManager = new CharacterManager(this.socketClient);
    this.currentPage = this._getCurrentPage();

    if (this.currentPage === 'index') {
      await this._initializeCharacterSelection();
    } else if (this.currentPage === 'game') {
      await this._initializeGame();
    }
    return true;
  } catch (error) {
    // Solo mostramos error si falla algo grave del diseño, no la conexión
    this._showErrorScreen(error.message);
  }
}

  /**
   * Obtiene la página actual
   * @private
   * @returns {string}
   */
  _getCurrentPage() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return filename.includes('game') ? 'game' : 'index';
  }

  /**
   * Inicializa la selección de personajes
   * @private
   * @returns {Promise}
   */
  async _initializeCharacterSelection() {
    Utils.log('Inicializando selección de personajes', 'info');

    const cards = Utils.getElements('.character-card');
    if (!cards || cards.length === 0) {
      Utils.log('Grid de personajes no encontrado', 'error');
      return;
    }

    cards.forEach(card => {
      const characterId = card.getAttribute('data-character');
      card.addEventListener('click', () => {
        this._handleCharacterSelection(characterId, card);
      });
    });

    const startButton = Utils.getElementById('#start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this._startGame();
      });
      this._updateStartButtonState();
    }

    this.characterManager.subscribe((event) => {
      this._updateCharacterCardUI(event);
      this._updateStartButtonState();
    });
  }

  /**
   * Crea una tarjeta de personaje
   * @private
   * @param {Object} character - Datos del personaje
   * @returns {Element}
   */
  _createCharacterCard(character) {
    const card = Utils.createElement('div', {
      class: 'character-card',
      'data-character-id': character.id,
      style: {
        borderColor: character.color,
        backgroundColor: character.color + '20'
      }
    }, `
      <div class="character-visual">
        <div class="character-emoji" style="font-size: 4rem;">${character.emoji}</div>
        <div class="character-border" style="borderColor: ${character.color}"></div>
      </div>
      <div class="character-info">
        <h3 class="character-name">${character.name}</h3>
        <p class="character-description">${character.description}</p>
        <div class="character-status">
          <span class="status-indicator">Disponible</span>
        </div>
      </div>
    `);

    return card;
  }

  /**
   * Maneja la selección de personaje
   * @private
   * @param {string} characterId - ID del personaje
   * @param {Element} card - Elemento de la tarjeta
   */
  async _handleCharacterSelection(characterId, card) {
    const isSelected = this.characterManager.isSelected(characterId);

    if (isSelected) {
      // Deseleccionar
      this.characterManager.deselectCharacter(characterId);
      card.classList.remove('selected');
    } else {
      // Seleccionar
      const success = await this.characterManager.selectCharacter(characterId);
      if (success) {
        card.classList.add('selected');
        Utils.playSound('assets/sounds/Patada.wav');
      } else {
        Utils.playSound('assets/sounds/Patada.wav');
      }
    }
  }

  /**
   * Actualiza la interfaz de la tarjeta de personaje
   * @private
   * @param {Object} event - Evento del cambio
   */

  _updateCharacterCardUI(event) {
      const cards = Utils.getElements('.character-card');

      cards.forEach(card => {
        const characterId = card.getAttribute('data-character');

        if (this.characterManager.isSelected(characterId)) {
          card.classList.add('selected');
        } else if (!this.characterManager.isAvailable(characterId)) {
          card.classList.add('unavailable');
        } else {
          card.classList.remove('selected', 'unavailable');
        }
      });
  }

  /**
   * Actualiza el estado del botón de inicio
   * @private
   */
  _updateStartButtonState() {
    const startButton = Utils.getElementById('#start-button');
    if (!startButton) return;

    const selectedCount = this.characterManager.getSelectedCharacters().length;
    const canStart = selectedCount > 0 && selectedCount <= GAME_CONFIG.MAX_CHARACTERS_PER_PLAYER;

    startButton.disabled = !canStart;
    startButton.classList.toggle('disabled', !canStart);

    const countText = Utils.getElementById('#selected-count');
    if (countText) {
      countText.textContent = `${selectedCount} / ${GAME_CONFIG.MAX_CHARACTERS_PER_PLAYER}`;
    }
  }

  /**
   * Inicia el juego
   * @private
   */
_startGame() {
    const selectedCharacters = this.characterManager.getSelectedCharacters();

    // Sin personajes seleccionados → error.html
    if (selectedCharacters.length === 0) {
        Utils.navigateTo('error.html');
        return;
    }

    // Guardar y navegar a game.html
    Utils.saveToStorage('playerCharacters', selectedCharacters);
    Utils.navigateTo('game.html');
}

  /**
   * Inicializa el juego
   * @private
   * @returns {Promise}
   */
  async _initializeGame() {
    Utils.log('Inicializando juego', 'info');

    // Recuperar personajes del almacenamiento
    const playerCharacters = Utils.getFromStorage('playerCharacters', []);
    this.characterManager.selectedCharacters = playerCharacters;

    // Crear controlador del juego
    this.gameController = new GameController(
        '#game-container',       // ID del contenedor principal
        '#controller-container',  // ID del div en game.html donde van las flores
        this.socketClient,
        this.characterManager
    );

    // Notificar al servidor que estamos listos
    this.socketClient.send({
      type: MESSAGE_TYPES.GAME_START,
      playerCharacters: playerCharacters,
      playerId: this.socketClient.getPlayerId()
    });

    // Suscribirse a eventos del juego
    this.gameController.subscribe((event) => {
      this._handleGameEvent(event);
    });
  }

  /**
   * Maneja eventos del juego
   * @private
   * @param {Object} event - Evento del juego
   */
  _handleGameEvent(event) {
    Utils.log(`Evento del juego: ${event.type}`, 'info');

    switch (event.type) {
      case 'gameStart':
        Utils.playSound('assets/sounds/start.mp3');
        break;
      case 'attack':
        // Manejado en el controlador del juego
        break;
      case 'gameEnd':
        setTimeout(() => {
          if (confirm('¿Quieres volver a jugar?')) {
            window.location.href = 'index.html';
          }
        }, 2000);
        break;
    }
  }

  /**
   * Muestra pantalla de error
   * @private
   * @param {string} message - Mensaje de error
   */
_showErrorScreen(message) {
    const body = document.body;
    body.innerHTML = `
      <div class="error-screen" style="
        background: linear-gradient(180deg, #FFB6E1 0%, #D5006D 100%);
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-family: 'Luckiest Guy', cursive;
        color: white;
      ">
        <h1 style="font-size: 4rem; text-shadow: 4px 4px 0 #000;">¡OH NO! ⚡</h1>
        <p style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; margin: 20px;">${message}</p>

        <button onclick="window.location.href='index.html'" style="
            padding: 15px 40px;
            font-size: 1.2rem;
            background: #000;
            color: #fff;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            font-family: 'Luckiest Guy';
        ">
          VOLVER AL INICIO
        </button>
      </div>
    `;
}

  /**
   * Limpia la aplicación
   */
  destroy() {
    if (this.gameController) {
      this.gameController.destroy();
    }
    if (this.socketClient) {
      this.socketClient.disconnect();
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const app = new CelestialFuryApp();
  await app.initialize();

  // Limpiar al cerrar la página
  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
});