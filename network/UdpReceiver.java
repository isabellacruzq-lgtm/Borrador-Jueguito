package org.valeneisa.network;
import org.valeneisa.patterns.INetworkObserver;
import java.net.DatagramPacket;
import java.net.DatagramSocket;

public class UdpReceiver extends  Thread {
    private INetworkObserver observer;
    private DatagramSocket socket;
    public UdpReceiver(DatagramSocket socket, INetworkObserver observer) {
        this.socket = socket;
        this.observer = observer;
    }

    @Override
    public void run() {
        byte[] buffer = new byte[1024];
        try {
            while (!socket.isClosed()) {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet); // Se queda esperando un paquete (Requisito 2.4)

                String mensaje = new String(packet.getData(), 0, packet.getLength());

                // Si alguien está escuchando (Observer), le pasamos el mensaje
                if (observer != null) {
                    observer.onMessageReceived(mensaje);
                }
            }
        } catch (Exception e) {
            System.err.println("Receptor cerrado o error: " + e.getMessage());
        }
    }
}
