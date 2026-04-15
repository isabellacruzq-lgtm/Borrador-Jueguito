/**
 * @fileoverview Funciones utilitarias para Celestial Fury
 * Proporciona métodos reutilizables para manipulación del DOM y lógica común
 * @author Celestial Fury Team
 */

/**
 * Clase utilitaria con métodos estáticos
 * Sigue principio SOLID: Single Responsibility
 * @class
 */
class Utils {
  static getElementById(selector) {
    return document.querySelector(selector);
  }

  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.classList.add(...value.split(' '));
      } else if (key === 'style') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    if (content) {
      element.innerHTML = content;
    }
    return element;
  }

  static async addClass(element, className, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        element.classList.add(className);
        resolve();
      }, delay);
    });
  }

  static removeClass(element, className) {
    element.classList.remove(className);
  }

  static toggleClass(element, className) {
    return element.classList.toggle(className);
  }

  static hasClass(element, className) {
    return element.classList.contains(className);
  }

  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Utils.generateUUID();
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  static getPlayerId() {
    let playerId = localStorage.getItem('playerId');
    if (!playerId) {
      playerId = Utils.generateUUID();
      localStorage.setItem('playerId', playerId);
    }
    return playerId;
  }

  static saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  static getFromStorage(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error leyendo de localStorage:', error);
      return defaultValue;
    }
  }

  static log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  static playSound(soundPath) {
    try {
      const audio = new Audio(soundPath);
      audio.play().catch(e => {
        Utils.log('No se pudo reproducir sonido: ' + e.message, 'warn');
      });
    } catch (error) {
      Utils.log('Error al reproducir sonido: ' + error.message, 'error');
    }
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static getURLParameter(paramName) {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  }

  static navigateTo(page, params = {}) {
    let url = page;
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += '?' + queryString;
    }
    window.location.href = url;
  }

  static supportsWebSocket() {
    return 'WebSocket' in window || 'MozWebSocket' in window;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
