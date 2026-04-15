package org.valeneisa.core;

/**
 * Contrato para cualquier sistema de reproducción de sonido.
 *
 * <p>Aplicando el principio de <b>Inversión de Dependencias (D)</b> de SOLID:
 * los módulos de alto nivel ({@link BattleController}) dependen de esta
 * abstracción, no de una implementación concreta.</p>
 *
 * @author Celestial Fury Team
 * @version 1.0
 */
public interface ISoundPlayer {

    /**
     * Reproduce un archivo de sonido dado su identificador lógico.
     *
     * @param soundKey identificador del sonido (ej: {@code "hit"}, {@code "attack"})
     */
    void play(String soundKey);
}