/**
 * Guarda el nombre de la heroína y cierra el modal.
 * Se llama desde el onclick del botón "Entrar" en index.html.
 */
function savePlayerName() {
  const input = document.getElementById('player-name-input');
  const modal = document.getElementById('name-modal');

  const name = input ? input.value.trim() : '';

  if (!name) {
    // Sacudir el input si está vacío
    input.style.borderColor = '#D5006D';
    input.style.animation = 'none';
    setTimeout(() => {
      input.style.animation = '';
      input.classList.add('anim-shake');
    }, 10);
    input.placeholder = '¡Escribe tu nombre! 🌸';
    input.focus();
    return;
  }

  // Guardar en sessionStorage para usarlo en game.html
  try {
    sessionStorage.setItem('playerName', name);
  } catch (e) {
    // fallback silencioso
  }

  // Cerrar el modal con una pequeña animación
  if (modal) {
    modal.style.transition = 'opacity 0.25s';
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.classList.remove('show');
      modal.style.opacity = '';
    }, 250);
  }
}

// También permitir presionar Enter en el input
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('player-name-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') savePlayerName();
    });
    // Auto-focus cuando aparece el modal
    setTimeout(() => input.focus(), 300);
  }
});
