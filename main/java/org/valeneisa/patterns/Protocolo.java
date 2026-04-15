package org.valeneisa.patterns;

public class Protocolo {
    // Formato: ACCION:NOMBRE:VALOR
    public static String mover(String nombre, int x, int y) {
        return "MOVE:" + nombre + ":" + x + "," + y;
    }

    public static String atacar(String nombre, String tipoAtaque) {
        return "ATTACK:" + nombre + ":" + tipoAtaque;
    }
}
