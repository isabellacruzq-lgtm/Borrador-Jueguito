package org.valeneisa.network;

import java.io.IOException;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import java.util.logging.Logger;

/**
 * UdpManager — Gestiona la comunicación P2P UDP entre dos jugadores.
 *
 * Flujo de uso:
 *   1. Crear instancia con el puerto local y la IP/puerto del rival.
 *   2. Llamar start() para lanzar el hilo receptor.
 *   3. Llamar send(mensaje) para enviar paquetes al rival.
 *   4. Registrar un listener con onMessage() para recibir eventos.
 *   5. Llamar stop() al terminar la partida.
 *
 * Protocolo de mensajes (texto plano separado por "|"):
 *   ATTACK|<attackId>|<damage>
 *   HP_UPDATE|<myHp>|<rivalHp>
 *   TURN|<playerId>
 *   CHAT|<texto>
 *   PING|<timestamp>
 *   PONG|<timestamp>
 *   SURRENDER
 */
public class UdpManager {

    private static final Logger LOG = Logger.getLogger(UdpManager.class.getName());
    private static final int BUFFER_SIZE = 1024;
    private static final int PING_INTERVAL_MS = 3000;

    private final int localPort;
    private final InetAddress rivalAddress;
    private final int rivalPort;

    private DatagramSocket socket;
    private volatile boolean running = false;

    private Consumer<String> messageListener;
    private Consumer<String> errorListener;

    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param localPort     Puerto UDP local en el que este jugador escucha.
     * @param rivalIp       IP del jugador rival (ej. "192.168.1.10").
     * @param rivalPort     Puerto UDP del jugador rival.
     */
    public UdpManager(int localPort, String rivalIp, int rivalPort) throws UnknownHostException {
        this.localPort    = localPort;
        this.rivalAddress = InetAddress.getByName(rivalIp);
        this.rivalPort    = rivalPort;
    }

    // -------------------------------------------------------------------------
    // Ciclo de vida
    // -------------------------------------------------------------------------

    /** Abre el socket y arranca el hilo receptor + el hilo de ping. */
    public void start() throws SocketException {
        socket  = new DatagramSocket(localPort);
        running = true;

        executor.submit(this::receiveLoop);
        executor.submit(this::pingLoop);

        LOG.info("[UDP] Escuchando en puerto " + localPort
                + " | Rival -> " + rivalAddress.getHostAddress() + ":" + rivalPort);
    }

    /** Cierra el socket y detiene los hilos. */
    public void stop() {
        running = false;
        executor.shutdownNow();
        if (socket != null && !socket.isClosed()) {
            socket.close();
        }
        LOG.info("[UDP] Conexión cerrada.");
    }

    // -------------------------------------------------------------------------
    // Envío
    // -------------------------------------------------------------------------

    /**
     * Envía un mensaje de texto al rival.
     *
     * @param message Cadena de texto (ej. "ATTACK|FIRE_BALL|35").
     */
    public void send(String message) {
        if (!running) {
            LOG.warning("[UDP] Intento de envío con conexión cerrada.");
            return;
        }
        byte[] data = message.getBytes(StandardCharsets.UTF_8);
        DatagramPacket packet = new DatagramPacket(data, data.length, rivalAddress, rivalPort);
        try {
            socket.send(packet);
            LOG.fine("[UDP] Enviado -> " + message);
        } catch (IOException e) {
            notifyError("Error al enviar paquete: " + e.getMessage());
        }
    }

    /** Métodos de conveniencia para los eventos del juego. */
    public void sendAttack(String attackId, int damage) {
        send("ATTACK|" + attackId + "|" + damage);
    }

    public void sendHpUpdate(int myHp, int rivalHp) {
        send("HP_UPDATE|" + myHp + "|" + rivalHp);
    }

    public void sendTurn(String playerId) {
        send("TURN|" + playerId);
    }

    public void sendChat(String text) {
        send("CHAT|" + text);
    }

    public void sendSurrender() {
        send("SURRENDER");
    }

    // -------------------------------------------------------------------------
    // Bucle receptor
    // -------------------------------------------------------------------------

    private void receiveLoop() {
        byte[] buffer = new byte[BUFFER_SIZE];
        while (running) {
            DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
            try {
                socket.receive(packet);
                String message = new String(packet.getData(), 0,
                        packet.getLength(), StandardCharsets.UTF_8).trim();
                LOG.fine("[UDP] Recibido <- " + message);

                // Responde a PING automáticamente
                if (message.startsWith("PING|")) {
                    String ts = message.split("\\|")[1];
                    send("PONG|" + ts);
                    continue;
                }

                if (messageListener != null) {
                    messageListener.accept(message);
                }
            } catch (SocketException e) {
                if (running) notifyError("Socket cerrado inesperadamente: " + e.getMessage());
                break;
            } catch (IOException e) {
                if (running) notifyError("Error al recibir paquete: " + e.getMessage());
            }
        }
    }

    // -------------------------------------------------------------------------
    // Ping periódico (keep-alive)
    // -------------------------------------------------------------------------

    private void pingLoop() {
        while (running) {
            try {
                Thread.sleep(PING_INTERVAL_MS);
                send("PING|" + System.currentTimeMillis());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    // -------------------------------------------------------------------------
    // Listeners
    // -------------------------------------------------------------------------

    /** Registra el callback que recibe cada mensaje del rival. */
    public void onMessage(Consumer<String> listener) {
        this.messageListener = listener;
    }

    /** Registra el callback para errores de red. */
    public void onError(Consumer<String> listener) {
        this.errorListener = listener;
    }

    private void notifyError(String msg) {
        LOG.warning("[UDP] " + msg);
        if (errorListener != null) errorListener.accept(msg);
    }

    // -------------------------------------------------------------------------
    // Getters de diagnóstico
    // -------------------------------------------------------------------------

    public boolean isRunning()          { return running; }
    public int     getLocalPort()       { return localPort; }
    public String  getRivalIp()         { return rivalAddress.getHostAddress(); }
    public int     getRivalPort()       { return rivalPort; }
}
