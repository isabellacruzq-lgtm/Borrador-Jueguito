package org.valeneisa.core;

import org.valeneisa.network.UdpManager;

/**
 * Controlador principal de la lógica de batalla entre dos jugadores.
 *
 * <p>Coordina los ataques locales, procesa los mensajes UDP del rival
 * y delega la reproducción de sonido a través de {@link ISoundPlayer}.</p>
 *
 * <p>Principios SOLID aplicados:</p>
 * <ul>
 *   <li><b>S</b> — Solo gestiona el estado de combate (vida, turno, ataques).</li>
 *   <li><b>O</b> — Nuevos tipos de mensaje se procesan extendiendo
 *       {@code procesarEntradaRival} sin modificar el resto.</li>
 *   <li><b>D</b> — Depende de {@link ISoundPlayer}, no de {@link SoundManager}
 *       directamente; permite sustituir la implementación de audio libremente.</li>
 * </ul>
 *
 * @author Team Celestial Fury
 * @version 1.0
 */
public class BattleController {

    /** Puntos de vida del jugador local. */
    private int miVida = 100;

    /** Puntos de vida del rival. */
    private int vidaRival = 100;

    /** Indica si es el turno del jugador local. */
    private boolean miTurno;

    /**
     * Sistema de sonido inyectado por dependencia.
     * Se depende de la abstracción {@link ISoundPlayer}, no de la implementación.
     */
    private final ISoundPlayer soundPlayer;

    /**
     * Construye el controlador de batalla con el estado inicial del turno
     * y el reproductor de sonido a utilizar.
     *
     * @param empiezoYo   {@code true} si el jugador local tiene el primer turno
     * @param soundPlayer implementación de {@link ISoundPlayer} para el audio
     */
    public BattleController(boolean empiezoYo, ISoundPlayer soundPlayer) {
        this.miTurno     = empiezoYo;
        this.soundPlayer = soundPlayer;
    }

    /**
     * Ejecuta un ataque local si es el turno del jugador.
     *
     * <p>Envía el ataque por red mediante {@link UdpManager} y cambia el turno.</p>
     *
     * <p>Reproduce {@code "special"} (Puño.wav) si la habilidad es especial
     * (Llama o Rayo), o {@code "attack"} (Explosion.wav) para el Golpe Básico.</p>
     *
     * @param danio           puntos de daño a infligir al rival
     * @param nombreHabilidad nombre de la habilidad utilizada
     */
    public void realizarAtaque(int danio, String nombreHabilidad) {
        if (!miTurno) {
            System.out.println("[BattleController] No es tu turno.");
            return;
        }

        UdpManager.getInstance().enviarMensaje("ATAQUE:" + danio + ":" + nombreHabilidad);

        // Habilidades especiales usan sonido "special" (Puño.wav),
        // el golpe básico usa "attack" (Explosion.wav)
        if (nombreHabilidad.equals("Golpe_Basico")) {
            soundPlayer.play("attack");
        } else {
            soundPlayer.play("special");
        }

        miTurno = false;

        System.out.println("[BattleController] Atacaste con " + nombreHabilidad
                + " (" + danio + " daño). Esperando rival...");
    }

    /**
     * Procesa un mensaje recibido por red desde el rival.
     *
     * <p>Formato esperado: {@code ATAQUE:<daño>:<habilidad>}</p>
     *
     * <p>Reduce la vida local, reproduce el sonido correspondiente
     * y cede el turno al jugador local.</p>
     *
     * @param mensaje cadena recibida por UDP
     */
    public void procesarEntradaRival(String mensaje) {
        if (!mensaje.startsWith("ATAQUE:")) {
            System.out.println("[BattleController] Mensaje desconocido: " + mensaje);
            return;
        }

        String[] partes  = mensaje.split(":");
        int      danio   = Integer.parseInt(partes[1]);
        String   habilidad = partes[2];

        miVida  -= danio;
        miTurno  = true;

        if (miVida <= 0) {
            soundPlayer.play("defeat");
            System.out.println("[BattleController] ¡Has sido derrotado!");
        } else {
            soundPlayer.play("hit");
            System.out.println("[BattleController] Recibiste " + danio
                    + " de daño por " + habilidad + ". Vida: " + miVida);
        }
    }

    /**
     * Retorna la vida actual del jugador local.
     *
     * @return puntos de vida restantes
     */
    public int getMiVida() { return miVida; }

    /**
     * Indica si actualmente es el turno del jugador local.
     *
     * @return {@code true} si es el turno local
     */
    public boolean isMiTurno() { return miTurno; }
}