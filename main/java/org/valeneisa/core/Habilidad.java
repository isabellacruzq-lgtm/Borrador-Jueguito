package org.valeneisa.core;

/**
 * Modelo inmutable que representa una habilidad de combate.
 *
 * <p>Principios SOLID aplicados:</p>
 * <ul>
 *   <li><b>S</b> — Solo almacena datos de una habilidad, sin lógica de combate.</li>
 *   <li><b>O</b> — Nuevas habilidades se crean en {@link HabilidadFactory}
 *       sin modificar esta clase.</li>
 * </ul>
 *
 * @author Celestial Fury Team
 * @version 1.0
 */
public class Habilidad {

    /** Nombre identificador de la habilidad (ej: {@code "Golpe_Basico"}). */
    private final String nombre;

    /** Puntos de daño que inflige esta habilidad. */
    private final int danio;

    /** Duración del cooldown en segundos. {@code 0} si no tiene cooldown. */
    private final int cooldownSegundos;

    /** Etiqueta visual que se muestra en el botón de la interfaz. */
    private final String etiquetaUI;

    /**
     * Construye una habilidad con todos sus atributos.
     *
     * @param nombre           identificador único de la habilidad
     * @param danio            daño que inflige (debe ser positivo)
     * @param cooldownSegundos duración del cooldown en segundos ({@code 0} = sin cooldown)
     * @param etiquetaUI       texto visible en el botón de la interfaz
     */
    public Habilidad(String nombre, int danio, int cooldownSegundos, String etiquetaUI) {
        this.nombre            = nombre;
        this.danio             = danio;
        this.cooldownSegundos  = cooldownSegundos;
        this.etiquetaUI        = etiquetaUI;
    }

    /**
     * @return nombre identificador de la habilidad
     */
    public String getNombre() { return nombre; }

    /**
     * @return daño que inflige la habilidad
     */
    public int getDanio() { return danio; }

    /**
     * @return duración del cooldown en segundos
     */
    public int getCooldownSegundos() { return cooldownSegundos; }

    /**
     * @return etiqueta visible en la interfaz de usuario
     */
    public String getEtiquetaUI() { return etiquetaUI; }
}