package org.valeneisa.core;

public class Player {
    private String nombre;
    private int puntaje;
    private String ip;

    public Player(String nombre, String ip) {
        this.nombre = nombre;
        this.ip = ip;
        this.puntaje = 0;
    }

    // Métodos simples para cumplir con la lógica del juego
    public void sumarPunto() { this.puntaje++; }
    public String getNombre() { return nombre; }
    public int getPuntaje() { return puntaje; }
    public String getIp() { return ip; }
}
