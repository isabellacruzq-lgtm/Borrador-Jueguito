/**
 * @fileoverview Gestor de personajes
 * Maneja selección, disponibilidad y sincronización de personajes
 * Sigue principio SOLID: Single Responsibility
 * @author Celestial Fury Team
 */

/**
 * Gestor de personajes con sincronización de servidor
 * @class
 */
class CharacterManager {
  /**
   * Constructor
   * @param {SocketClient} socketClient - Cliente WebSocket
   */
  constructor(socketClient) {
    this.socketClient = socketClient;
    this.selectedCharacters = [];
    this.availableCharacters = { ...CHARACTERS };
    this.unavailableCharacters = new Set();
    this.observers = [];
    this._setupSocketListeners();
  }

  /**
   * Configura los listeners del WebSocket
   * @private
   */
  _setupSocketListeners() {
    this.socketClient.on(MESSAGE_TYPES.CHARACTER_SELECTED, (data) => {
      this._handleCharacterSelected(data);
    });

    this.socketClient.on(MESSAGE_TYPES.CHARACTER_UNAVAILABLE, (data) => {
      this._handleCharacterUnavailable(data);
    });
  }

  /**
   * Maneja cuando un personaje es seleccionado por otro jugador
   * @private
   * @param {Object} data - Datos del personaje
   */
  _handleCharacterSelected(data) {
    const characterId = data.characterId;
    if (characterId !== this.selectedCharacters) {
      this.unavailableCharacters.add(characterId);
      this._notifyObservers('characterUnavailable', characterId);
    }
  }

  /**
   * Maneja cuando un personaje se vuelve no disponible
   * @private
   * @param {Object} data - Datos del personaje
   */
  _handleCharacterUnavailable(data) {
    this.unavailableCharacters.add(data.characterId);
    this._notifyObservers('characterUnavailable', data.characterId);
  }

  /**
   * Selecciona un personaje
   * @param {string} characterId - ID del personaje
   * @returns {Promise<boolean>} True si se seleccionó exitosamente
   */
  async selectCharacter(characterId) {
    // Validar que el personaje existe
    if (!CHARACTERS[characterId.toUpperCase()]) {
      Utils.log(`Personaje no válido: ${characterId}`, 'error');
      return false;
    }

    // Validar que no está seleccionado
    if (this.selectedCharacters.includes(characterId)) {
      Utils.log(`Personaje ya seleccionado: ${characterId}`, 'warn');
      return false;
    }

    // Validar límite de personajes
    if (this.selectedCharacters.length >= GAME_CONFIG.MAX_CHARACTERS_PER_PLAYER) {
      Utils.log('Límite de personajes alcanzado', 'warn');
      return false;
    }

    // Validar disponibilidad
    if (this.unavailableCharacters.has(characterId)) {
      Utils.log(`Personaje no disponible: ${characterId}`, 'warn');
      return false;
    }

    // Agregar a seleccionados
    this.selectedCharacters.push(characterId);
    this.unavailableCharacters.add(characterId);

    // Notificar al servidor
    try {
      this.socketClient.send({
        type: MESSAGE_TYPES.SELECT_CHARACTER,
        characterId: characterId,
        playerId: this.socketClient.getPlayerId()
      });
    } catch (e) {
      Utils.log('Sin conexión, selección guardada localmente', 'warn');
    }
    // Notificar observadores
    this._notifyObservers('characterSelected', characterId);
    Utils.log(`Personaje seleccionado: ${characterId}`, 'info');

    return true;
  }

  /**
   * Deselecciona un personaje
   * @param {string} characterId - ID del personaje
   * @returns {boolean}
   */
  deselectCharacter(characterId) {
    const index = this.selectedCharacters.indexOf(characterId);
    if (index > -1) {
      this.selectedCharacters.splice(index, 1);
      this._notifyObservers('characterDeselected', characterId);
      return true;
    }
    return false;
  }

  /**
   * Obtiene los personajes seleccionados
   * @returns {Array<string>}
   */
  getSelectedCharacters() {
    return [...this.selectedCharacters];
  }

  /**
   * Verifica si un personaje está seleccionado
   * @param {string} characterId - ID del personaje
   * @returns {boolean}
   */
  isSelected(characterId) {
    return this.selectedCharacters.includes(characterId);
  }

  /**
   * Verifica si un personaje está disponible
   * @param {string} characterId - ID del personaje
   * @returns {boolean}
   */
  isAvailable(characterId) {
    return !this.unavailableCharacters.has(characterId);
  }

  /**
   * Obtiene información del personaje
   * @param {string} characterId - ID del personaje
   * @returns {Object|null}
   */
  getCharacterInfo(characterId) {
    const key = characterId.toUpperCase();
    return CHARACTERS[key] || null;
  }

  /**
   * Obtiene todos los personajes disponibles
   * @returns {Array<Object>}
   */
  getAvailableCharacters() {
    return Object.entries(CHARACTERS)
      .filter(([key]) => !this.unavailableCharacters.has(CHARACTERS[key].id))
      .map(([, character]) => character);
  }

  /**
   * Obtiene todos los personajes
   * @returns {Object}
   */
  getAllCharacters() {
    return { ...CHARACTERS };
  }

  /**
   * Limpia la selección de personajes
   */
  clearSelection() {
    this.selectedCharacters = [];
    this.unavailableCharacters.clear();
    this._notifyObservers('selectionCleared', null);
  }

  /**
   * Se suscribe a cambios
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
   * Notifica a todos los observadores
   * @private
   * @param {string} eventType - Tipo de evento
   * @param {*} data - Datos del evento
   */
  _notifyObservers(eventType, data) {
    this.observers.forEach(callback => {
      try {
        callback({ type: eventType, data });
      } catch (error) {
        Utils.log(`Error en observador: ${error.message}`, 'error');
      }
    });
  }

  /**
   * Obtiene el color de un personaje
   * @param {string} characterId - ID del personaje
   * @returns {string} Código de color
   */
  getCharacterColor(characterId) {
    const character = this.getCharacterInfo(characterId);
    return character ? character.color : '#000000';
  }
}// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CharacterManager;
}