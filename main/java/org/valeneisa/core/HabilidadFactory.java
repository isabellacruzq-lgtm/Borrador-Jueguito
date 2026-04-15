package org.valeneisa.core;

import java.util.Arrays;
import java.util.List;

/**
 * Fábrica que centraliza la creación de todas las habilidades del juego.
 *
 * <p>Principios SOLID aplicados:</p>
 * <ul>
 *   <li><b>S</b> — Responsabilidad única: solo construye habilidades.</li>
 *   <li><b>O</b> — Para agregar una habilidad nueva, solo se modifica
 *       este factory sin tocar {@link Habilidad}, {@link BattleController}
 *       ni {@link org.valeneisa.ui.GameWindow}.</li>
 * </ul>
 *
 * @author Celestial Fury Team
 * @version 1.0
 */
public class HabilidadFactory {

    /**
     * Constructor privado: clase de utilidad, no debe instanciarse.
     */
    private HabilidadFactory() {}

    /**
     * Retorna la lista completa de habilidades disponibles en el juego.
     *
     * @return lista inmutable de {@link Habilidad}
     */
    public static List<Habilidad> crearHabilidades() {
        return Arrays.asList(
                new Habilidad("Golpe_Basico", 10, 0, "⚔ Golpe Básico"),
                new Habilidad("Llama",        25, 3, "🔥 Llama"),
                new Habilidad("Rayo",         40, 5, "⚡ Rayo")
        );
    }
}