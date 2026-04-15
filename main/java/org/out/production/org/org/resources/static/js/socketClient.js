/**
 * @fileoverview Cliente WebSocket para comunicación con servidor
 * Implementa patrón Observer para notificaciones de eventos
 * Sigue principio SOLID: Dependency Inversion
 * @author Celestial Fury Team
 */

/**
 * Cliente WebSocket singleton
 * Maneja toda la comunicación con el servidor
 * @class
 */
class SocketClient {
  /**
   * Constructor privado para implementar singleton
   */
  constructor() {
    this.socket = null;
    this.connected = false;
    this.observers = {};
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.playerId = Utils.getPlayerId();
    this.sessionId = Utils.getSessionId();
  }

  /**
   * Obtiene la instancia singleton
   * @returns {SocketClient} Instancia del cliente
   */
  static getInstance() {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  /**
   * Conecta al servidor WebSocket
   * @returns {Promise} Se resuelve cuando se conecta
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${SERVER_CONFIG.WS_PROTOCOL}${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}${SERVER_CONFIG.WS_PATH}`;

        Utils.log(`Conectando a ${wsUrl}...`, 'info');
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          Utils.log('Conectado al servidor', 'info');
          this.connected = true;
          this.reconnectAttempts = 0;

          // Enviar mensaje de conexión
          this.send({
            type: MESSAGE_TYPES.CONNECT,
            playerId: this.playerId,
            sessionId: this.sessionId
          });

          // Procesar cola de mensajes pendientes
          this._procesMessageQueue();

          resolve();
        };

        this.socket.onmessage = (event) => {
          this._handleMessage(event.data);
        };

        this.socket.onerror = (error) => {
          Utils.log(`Error en WebSocket: ${error.message}`, 'error');
          this.connected = false;
          this._notifyObservers(MESSAGE_TYPES.ERROR, error);
          reject(error);
        };

        this.socket.onclose = () => {
          Utils.log('Desconectado del servidor', 'warn');
          this.connected = false;
          this._attemptReconnect();
        };
      } catch (error) {
        Utils.log(`Error al conectar: ${error.message}`, 'error');
        reject(error);
      }
    });
  }

  /**
   * Intenta reconectarse al servidor
   * @private
   */
  _attemptReconnect() {
    if (this.reconnectAttempts < SERVER_CONFIG.RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = SERVER_CONFIG.RECONNECT_DELAY * this.reconnectAttempts;

      Utils.log(`Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`, 'warn');

      setTimeout(() => {
        this.connect().catch(() => {
          // Reintentar recursivamente si falla
        });
      }, delay);
    } else {
      Utils.log('Máximo de reintentos alcanzado', 'error');
      this._notifyObservers(MESSAGE_TYPES.ERROR, {
        message: 'No se pudo conectar al servidor'
      });
    }
  }

  /**
   * Maneja mensajes recibidos del servidor
   * @private
   * @param {string} data - Datos del mensaje
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(data);
      Utils.log(`Mensaje recibido: ${message.type}`, 'info');
      this._notifyObservers(message.type, message.data);
    } catch (error) {
      Utils.log(`Error parseando mensaje: ${error.message}`, 'error');
    }
  }

  /**
   * Envía un mensaje al servidor
   * Si no está conectado, lo encola
   * @param {Object} message - Mensaje a enviar
   * @returns {boolean} True si se envió, false si se encola
   */
  send(message) {
    if (!this.connected) {
      Utils.log('No conectado, encolando mensaje', 'warn');
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      Utils.log(`Mensaje enviado: ${message.type}`, 'info');
      return true;
    } catch (error) {
      Utils.log(`Error enviando mensaje: ${error.message}`, 'error');
      this.messageQueue.push(message);
      return false;
    }
  }

  /**
   * Procesa la cola de mensajes pendientes
   * @private
   */
  _procesMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Se suscribe a un tipo de mensaje
   * Patrón Observer
   * @param {string} messageType - Tipo de mensaje
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  on(messageType, callback) {
    if (!this.observers[messageType]) {
      this.observers[messageType] = [];
    }

    this.observers[messageType].push(callback);

    // Retorna función para desuscribirse
    return () => {
      this.observers[messageType] = this.observers[messageType].filter(
        cb => cb !== callback
      );
    };
  }

  /**
   * Se suscribe a un mensaje una sola vez
   * @param {string} messageType - Tipo de mensaje
   * @param {Function} callback - Función a ejecutar
   */
  once(messageType, callback) {
    const unsubscribe = this.on(messageType, (data) => {
      callback(data);
      unsubscribe();
    });
  }

  /**
   * Notifica a todos los observadores de un tipo de mensaje
   * @private
   * @param {string} messageType - Tipo de mensaje
   * @param {Object} data - Datos a pasar
   */
  _notifyObservers(messageType, data) {
    if (this.observers[messageType]) {
      this.observers[messageType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Utils.log(`Error en callback: ${error.message}`, 'error');
        }
      });
    }
  }

  /**
   * Desconecta del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      Utils.log('Desconectado manualmente', 'info');
    }
  }

  /**
   * Obtiene el estado de conexión
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Obtiene el ID del jugador
   * @returns {string}
   */
  getPlayerId() {
    return this.playerId;
  }

  /**
   * Obtiene el ID de la sesión
   * @returns {string}
   */
  getSessionId() {
    return this.sessionId;
  }
}

// Exportar singleton
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketClient;
}
