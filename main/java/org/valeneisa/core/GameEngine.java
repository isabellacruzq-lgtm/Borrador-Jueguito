package org.valeneisa.core;

/**
 * Clase que centraliza las reglas.
 * Cumple con Responsabilidad Única (SOLID).
 */
public class GameEngine {
    public static final int MAX_PUNTOS = 10;
    public static final int ANCHO = 800;
    public static final int ALTO = 600;

    // Regla 1: Movimiento válido (Requisito 2.5)
    public boolean validarMovimiento(int x, int y) {
        return (x >= 0 && x <= ANCHO) && (y >= 0 && y <= ALTO);
    }

    // Regla 2: Condición de victoria (Requisito 2.5)
    public boolean verificarGanador(Player p) {
        return p.getPuntaje() >= MAX_PUNTOS;
    }

    // Regla 3: El puntaje no puede ser negativo
    // Regla 4: Los nombres no pueden estar vacíos
    // Regla 5: Sincronización obligatoria (manejada por la red)
}