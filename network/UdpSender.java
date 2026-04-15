package org.valeneisa.network;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

public class UdpSender {
    private DatagramSocket socket;

    public UdpSender(DatagramSocket socket) {
        this.socket = socket;
    }

    public void enviarMensaje(String mensaje, String ipDestino, int puerto) {
        new Thread(() -> {
            try {
                byte[] data = mensaje.getBytes();
                InetAddress address = InetAddress.getByName(ipDestino);
                DatagramPacket packet = new DatagramPacket(data, data.length, address, puerto);
                socket.send(packet);
            } catch (Exception e) {
                System.err.println("Error al enviar: " + e.getMessage());
            }
        }).start(); // Lo hace en un hilo aparte para no congelar el juego
    }
}