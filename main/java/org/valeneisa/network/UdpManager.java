package org.valeneisa.network;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.function.Consumer;

/**
 * Gestor de comunicación UDP entre jugadores.
 *
 * <p>Soporta dos instancias en la misma PC usando puertos diferentes:
 * Jugador 1 escucha en 9876 y envía al 9877.
 * Jugador 2 escucha en 9877 y envía al 9876.</p>
 *
 * <p>Principios SOLID aplicados:</p>
 * <ul>
 *   <li><b>S</b> — Solo gestiona el envío y recepción de mensajes UDP.</li>
 *   <li><b>D</b> — El puerto se configura externamente via propiedad del sistema.</li>
 * </ul>
 *
 * @author Celestial Fury Team
 * @version 1.0
 */
public class UdpManager {

    /** Única instancia Singleton. */
    private static UdpManager instance;

    /** IP del jugador destino. */
    private String ipDestino;

    /**
     * Puerto local de escucha. Se define con la propiedad del sistema
     * {@code -DpuertoEscucha=9876} o {@code -DpuertoEscucha=9877}.
     * Por defecto usa 9876 (Jugador 1).
     */
    private final int puertoEscucha;

    /**
     * Puerto destino al que se envían los mensajes.
     * Es el opuesto al puerto de escucha.
     */
    private final int puertoDestino;

    /**
     * Constructor privado. Lee el puerto desde las propiedades del sistema.
     */
    private UdpManager() {
        this.puertoEscucha  = Integer.parseInt(System.getProperty("puertoEscucha", "9876"));
        this.puertoDestino  = (puertoEscucha == 9876) ? 9877 : 9876;
        System.out.println("[UdpManager] Escucha: " + puertoEscucha + " | Destino: " + puertoDestino);
    }

    /**
     * Retorna la única instancia de {@code UdpManager}.
     *
     * @return instancia singleton
     */
    public static UdpManager getInstance() {
        if (instance == null) {
            instance = new UdpManager();
        }
        return instance;
    }

    /**
     * Establece la IP del jugador destino.
     *
     * @param ip dirección IP del rival
     */
    public void setIpDestino(String ip) {
        this.ipDestino = ip;
        System.out.println("[UdpManager] Objetivo fijado en: " + ip);
    }

    /**
     * Envía un mensaje UDP al rival de forma asíncrona.
     *
     * @param mensaje cadena a enviar (ej: {@code "ATAQUE:10:Golpe_Basico"})
     */
    public void enviarMensaje(String mensaje) {
        if (ipDestino == null || ipDestino.isEmpty()) {
            System.err.println("[UdpManager] Error: No hay IP de destino.");
            return;
        }

        new Thread(() -> {
            try (DatagramSocket socket = new DatagramSocket()) {
                byte[] buffer = mensaje.getBytes();
                InetAddress address = InetAddress.getByName(ipDestino);
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length, address, puertoDestino);
                socket.send(packet);
                System.out.println("[UdpManager] Enviado: " + mensaje);
            } catch (Exception e) {
                System.err.println("[UdpManager] Error al enviar: " + e.getMessage());
            }
        }).start();
    }

    /**
     * Inicia la escucha de mensajes UDP en el puerto local asignado.
     *
     * @param callback función que procesa cada mensaje recibido
     */
    public void iniciarEscucha(Consumer<String> callback) {
        new Thread(() -> {
            try (DatagramSocket socket = new DatagramSocket(puertoEscucha)) {
                byte[] buffer = new byte[1024];
                System.out.println("[UdpManager] Escuchando en puerto " + puertoEscucha + "...");

                while (true) {
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    socket.receive(packet);
                    String recibido = new String(packet.getData(), 0, packet.getLength());
                    callback.accept(recibido);
                }
            } catch (Exception e) {
                System.err.println("[UdpManager] Error en escucha: " + e.getMessage());
            }
        }).start();
    }
}