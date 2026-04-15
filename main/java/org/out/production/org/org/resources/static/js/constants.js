/**
 * @fileoverview Constantes globales de la aplicación Celestial Fury
 * Define colores, personajes y configuración del servidor
 * @author Celestial Fury Team
 */

const COLORS = {
  BOMBON: '#FFB6E1',
  BURBUJA: '#ADD8E6',
  BELLOTA: '#90EE90',
  BRISA: '#DDA0DD'
};

const CHARACTERS = {
  BOMBON: {
    id: 'bombon',
    name: 'Bombón',
    color: COLORS.BOMBON,
    emoji: '🌸',
    description: 'Fuerte y valiente'
  },
  BURBUJA: {
    id: 'burbuja',
    name: 'Burbuja',
    color: COLORS.BURBUJA,
    emoji: '💧',
    description: 'Rápida e inteligente'
  },
  BELLOTA: {
    id: 'bellota',
    name: 'Bellota',
    color: COLORS.BELLOTA,
    emoji: '🍃',
    description: 'Ágil y astuta'
  },
  BRISA: {
    id: 'brisa',
    name: 'Brisa',
    color: COLORS.BRISA,
    emoji: '🌪️',
    description: 'Mística y poderosa'
  }
};

const SERVER_CONFIG = {
  HOST: '127.0.0.1', // Usa IP en lugar de localhost para evitar demoras de DNS
  PORT: 8080,
  WS_PROTOCOL: 'ws://',
  WS_PATH: '/celestial',
  RECONNECT_ATTEMPTS: 1, // Baja esto a 1 para que no se quede intentando siempre
  RECONNECT_DELAY: 1000
};

const MESSAGE_TYPES = {
  SELECT_CHARACTER: 'SELECT_CHARACTER',
  CHARACTER_SELECTED: 'CHARACTER_SELECTED',
  CHARACTER_UNAVAILABLE: 'CHARACTER_UNAVAILABLE',
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND',
  SPECIAL_MOVE: 'SPECIAL_MOVE',
  GAME_START: 'GAME_START',
  GAME_END: 'GAME_END',
  PLAYER_HIT: 'PLAYER_HIT',
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  ERROR: 'ERROR'
};

const ANIMATION_CONFIG = {
  PUNCH_DURATION: 600,
  PUNCH_DELAY: 200,
  FLOWER_SPEED: 'faster',
  IMPACT_DURATION: 300
};

const GAME_CONFIG = {
  MAX_PLAYERS_PER_SESSION: 2,
  MAX_CHARACTERS_PER_PLAYER: 2,
  SESSION_TIMEOUT: 600000,
  DEFAULT_HEALTH: 100
};
