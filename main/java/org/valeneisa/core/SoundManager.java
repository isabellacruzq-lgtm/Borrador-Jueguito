package org.valeneisa.core;

import javax.sound.sampled.*;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestor centralizado de sonidos del juego.
 *
 * <p>Implementa {@link ISoundPlayer} y sigue el patrón <b>Singleton</b>
 * para garantizar una única instancia durante la ejecución.</p>
 *
 * <p>Principios SOLID aplicados:</p>
 * <ul>
 *   <li><b>S</b> — Responsabilidad única: solo gestiona reproducción de audio.</li>
 *   <li><b>D</b> — Expone {@link ISoundPlayer} como contrato público.</li>
 * </ul>
 *
 * <p>Los sonidos deben estar en {@code assets/sounds/} con extensión {@code .wav}.</p>
 *
 * @author Celestial Fury Team
 * @version 1.0
 */
public class SoundManager implements ISoundPlayer {

    /** Única instancia de la clase (Singleton). */
    private static SoundManager instancia;

    /** Mapa de clave lógica → ruta de archivo. */
    private final Map<String, String> rutas = new HashMap<>();

    /**
     * Constructor privado. Registra los sonidos disponibles del juego.
     */
    private SoundManager() {
        rutas.put("attack", "assets/sounds/Explosion.wav");
        rutas.put("hit",    "assets/sounds/Ganador.wav");
        rutas.put("defeat", "assets/sounds/Patada.wav");
        rutas.put("special", "assets/sounds/Puño.wav");

    }

    /**
     * Retorna la única instancia de {@code SoundManager}.
     *
     * @return instancia singleton de {@code SoundManager}
     */
    public static SoundManager getInstance() {
        if (instancia == null) {
            instancia = new SoundManager();
        }
        return instancia;
    }

    /**
     * Reproduce el sonido asociado a la clave lógica dada.
     *
     * <p>Si la clave no existe o el archivo no se encuentra,
     * imprime un aviso en consola sin lanzar excepción,
     * cumpliendo con robustez ante errores de recursos.</p>
     *
     * @param soundKey clave lógica del sonido (ej: {@code "hit"})
     */
    @Override
    public void play(String soundKey) {
        String ruta = rutas.get(soundKey);

        if (ruta == null) {
            System.out.println("[SoundManager] Clave desconocida: " + soundKey);
            return;
        }

        File archivo = new File(ruta);
        if (!archivo.exists()) {
            System.out.println("[SoundManager] Archivo no encontrado: " + ruta);
            return;
        }

        try {
            AudioInputStream audio = AudioSystem.getAudioInputStream(archivo);
            Clip clip = AudioSystem.getClip();
            clip.open(audio);
            clip.start();
        } catch (UnsupportedAudioFileException | IOException | LineUnavailableException e) {
            System.out.println("[SoundManager] Error al reproducir '" + soundKey + "': " + e.getMessage());
        }
    }
}