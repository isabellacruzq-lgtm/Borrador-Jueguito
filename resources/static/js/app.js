class CelestialFuryApp {
  constructor() {
    this.socketClient = null;
    this.characterManager = null;
    this.gameController = null;
    this.currentPage = 'index';
  }

  async initialize() {
    try {
      this.socketClient = SocketClient.getInstance();

      // 🔥 NO bloquear UI
      this.socketClient.connect().catch(() => {
        console.warn("Sin conexión WS, modo local");
      });

      this.characterManager = new CharacterManager(this.socketClient);
      this.currentPage = this._getCurrentPage();

      if (this.currentPage === 'index') {
        await this._initializeCharacterSelection();
      } else if (this.currentPage === 'game') {
        await this._initializeGame();
      }

      return true;

    } catch (error) {
      this._showErrorScreen(error.message);
    }
  }

  _getCurrentPage() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return filename.includes('game') ? 'game' : 'index';
  }

  async _initializeCharacterSelection() {
    Utils.log('Inicializando selección de personajes', 'info');

    const cards = Utils.getElements('.character-card');
    if (!cards || cards.length === 0) return;

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

  async _handleCharacterSelection(characterId, card) {
    const isSelected = this.characterManager.isSelected(characterId);

    if (isSelected) {
      this.characterManager.deselectCharacter(characterId);
      card.classList.remove('selected');
    } else {
      const success = await this.characterManager.selectCharacter(characterId);

      if (success) {
        card.classList.add('selected');
      }
    }
  }

  _updateCharacterCardUI() {
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

  _startGame() {
    const selectedCharacters = this.characterManager.getSelectedCharacters();

    if (selectedCharacters.length === 0) {
      Utils.navigateTo('error.html');
      return;
    }

    Utils.saveToStorage('playerCharacters', selectedCharacters);
    Utils.navigateTo('game.html');
  }

  async _initializeGame() {

    await new Promise(resolve => setTimeout(resolve, 100));
    Utils.log('Inicializando juego', 'info');

    const playerCharacters = Utils.getFromStorage('playerCharacters', []);
    this.characterManager.selectedCharacters = playerCharacters;

    let controllerDiv = document.getElementById("controller-container");

    if (!controllerDiv) {
      console.error("🔥 Creando controller-container manualmente");

      controllerDiv = document.createElement("div");
      controllerDiv.id = "controller-container";

      document.body.appendChild(controllerDiv);
    }

    this.gameController = new GameController(
      'game-container',
      'controller-container',
      this.socketClient,
      this.characterManager
    );

    // =========================
    // 🎮 LISTENERS WEBSOCKET REALES
    // =========================

    // RELAY: ataque enviado por el rival (relay puro desde el servidor)
    this.socketClient.on("RELAY", (data) => {
      const inner = data.payload || data;
      const type  = String(inner.type || "").toUpperCase();

      if (type === "ATTACK") {
        const damage = Number(inner.damage ?? inner.danio ?? 0);
        this._applyDamageToOpponent(damage);
      }
    });

    // HP_UPDATE: el servidor recalculó el estado tras un ataque
    this.socketClient.on("HP_UPDATE", (data) => {
      const localHp = Number(data.localHp ?? 100);
      const rivalHp = Number(data.rivalHp ?? 100);
      this._setHpBar("opponentHealthText", "opponentHealthFill", rivalHp);
      this._setHpBar("localHealthText",    "localHealthFill",    localHp);

      const status = document.getElementById("battleStatus");
      if (status) status.innerText = "⚔️ ¡Ataque recibido!";
    });

    // GAME_OVER: alguien se quedó sin vida
    this.socketClient.on("GAME_OVER", (data) => {
      const winner = data.winner || "RIVAL";
      const status = document.getElementById("battleStatus");
      if (status) status.innerText = winner === "LOCAL" ? "🏆 ¡Ganaste!" : "💀 Perdiste…";
      console.log("[GameOver] Ganador:", winner);
    });
  }

  /** Aplica daño a la barra del oponente */
  _applyDamageToOpponent(damage) {
    const hpText = document.getElementById("opponentHealthText");
    if (!hpText) return;

    let hp = parseInt(hpText.innerText.split("/")[0]) || 0;
    hp = Math.max(0, hp - damage);

    this._setHpBar("opponentHealthText", "opponentHealthFill", hp);

    const status = document.getElementById("battleStatus");
    if (status) status.innerText = "⚔️ ¡Ataque recibido!";
  }

  /** Actualiza texto y barra de vida (max 100) */
  _setHpBar(textId, fillId, hp) {
    const hpText = document.getElementById(textId);
    const bar    = document.getElementById(fillId);
    if (hpText) hpText.innerText = `${hp} / 100`;
    if (bar)    bar.style.width  = `${hp}%`;
  }

  _showErrorScreen(message) {
    document.body.innerHTML = `<h1>Error</h1><p>${message}</p>`;
  }

  destroy() {
    if (this.gameController) this.gameController.destroy();
    if (this.socketClient) this.socketClient.disconnect();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new CelestialFuryApp();
  await app.initialize();

  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
});