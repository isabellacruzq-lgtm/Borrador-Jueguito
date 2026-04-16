package org.valeneisa.network;

import java.io.IOException;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import java.util.logging.Logger;

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

    public UdpManager(int localPort, String rivalIp, int rivalPort) throws UnknownHostException {
        this.localPort    = localPort;
        this.rivalAddress = InetAddress.getByName(rivalIp);
        this.rivalPort    = rivalPort;
    }

    // =========================
    // START / STOP
    // =========================

    public void start() throws SocketException {
        socket  = new DatagramSocket(localPort);
        running = true;

        executor.submit(this::receiveLoop);
        executor.submit(this::pingLoop);

        LOG.info("[UDP] Escuchando en puerto " + localPort
                + " | Rival -> " + rivalAddress.getHostAddress() + ":" + rivalPort);
    }

    public void stop() {
        running = false;
        executor.shutdownNow();
        if (socket != null && !socket.isClosed()) {
            socket.close();
        }
        LOG.info("[UDP] Conexión cerrada.");
    }

    // =========================
    // ENVÍO
    // =========================

    public void send(String message) {
        if (!running) {
            LOG.warning("[UDP] Intento de envío con conexión cerrada.");
            return;
        }

        byte[] data = message.getBytes(StandardCharsets.UTF_8);
        DatagramPacket packet = new DatagramPacket(data, data.length, rivalAddress, rivalPort);

        try {
            socket.send(packet);
            LOG.info("[UDP] → " + message);
        } catch (IOException e) {
            notifyError("Error al enviar paquete: " + e.getMessage());
        }
    }

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

    // =========================
    // RECEIVE LOOP
    // =========================

    private void receiveLoop() {
        byte[] buffer = new byte[BUFFER_SIZE];

        while (running) {
            DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

            try {
                socket.receive(packet);

                String message = new String(
                        packet.getData(), 0,
                        packet.getLength(),
                        StandardCharsets.UTF_8
                ).trim();

                LOG.info("[UDP] ← " + message);

                // 🔥 RESPUESTA AUTOMÁTICA PING
                if (message.startsWith("PING|")) {
                    String ts = message.split("\\|")[1];
                    send("PONG|" + ts);
                    continue;
                }

                // 🔥 ENVIAR AL BRIDGE
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

    // =========================
    // PING LOOP
    // =========================

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

    // =========================
    // LISTENERS
    // =========================

    public void onMessage(Consumer<String> listener) {
        this.messageListener = listener;
    }

    public void onError(Consumer<String> listener) {
        this.errorListener = listener;
    }

    private void notifyError(String msg) {
        LOG.warning("[UDP] " + msg);
        if (errorListener != null) errorListener.accept(msg);
    }

    // =========================
    // GETTERS
    // =========================

    public boolean isRunning()    { return running; }
    public int getLocalPort()     { return localPort; }
    public String getRivalIp()    { return rivalAddress.getHostAddress(); }
    public int getRivalPort()     { return rivalPort; }
}