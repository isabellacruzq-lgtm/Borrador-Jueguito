package org.valeneisa.network;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Map;
import java.util.logging.Logger;

public class NetworkBridge {

    private static final Logger LOG = Logger.getLogger(NetworkBridge.class.getName());

    private final UdpManager udpManager;
    private final ObjectMapper mapper = new ObjectMapper();

    public NetworkBridge(int localUdpPort,
                         String rivalIp,
                         int rivalUdpPort) throws UnknownHostException {

        this.udpManager = new UdpManager(localUdpPort, rivalIp, rivalUdpPort);
    }

    // =========================
    // INICIO / STOP
    // =========================

    public void start() throws SocketException {
        udpManager.onMessage(this::onUdpMessageReceived);
        udpManager.onError(msg -> LOG.severe("[Bridge] Error UDP: " + msg));
        udpManager.start();
        LOG.info("[Bridge] NetworkBridge activo.");
    }

    public void stop() {
        udpManager.stop();
        LOG.info("[Bridge] NetworkBridge detenido.");
    }

    // =========================
    // UDP → INTERNO (SIN WS)
    // =========================

    private void onUdpMessageReceived(String rawMessage) {
        try {
            String json = udpToJson(rawMessage);

            LOG.info("[Bridge] UDP recibido: " + json);

            // 🔥 ENVIAR A BattleController
            if (onUdpEvent != null) {
                onUdpEvent.accept(json);
            }

            // 🔥 EXTRA: imprimir para frontend (puente)
            Map<String, Object> msg = mapper.readValue(json, Map.class);
            String type = String.valueOf(msg.getOrDefault("type", "")).toUpperCase();

            if (type.equals("ATTACK")) {
                int damage = ((Number) msg.getOrDefault("damage", 0)).intValue();
                System.out.println("FRONT_ATTACK:" + damage);
            }

        } catch (Exception e) {
            LOG.warning("[Bridge] Error UDP: " + e.getMessage());
        }
    }

    // =========================
    // PARSER UDP → JSON
    // =========================

    private String udpToJson(String raw) throws Exception {
        String[] parts = raw.split("\\|");
        String type = parts[0].toUpperCase();

        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("type", type);

        switch (type) {

            case "ATTACK" -> {
                map.put("attackId", parts.length > 1 ? parts[1] : "");
                map.put("damage", parts.length > 2 ? Integer.parseInt(parts[2]) : 0);
            }

            case "HP_UPDATE" -> {
                map.put("myHp", parts.length > 1 ? Integer.parseInt(parts[1]) : 0);
                map.put("rivalHp", parts.length > 2 ? Integer.parseInt(parts[2]) : 0);
            }

            case "TURN" -> map.put("playerId", parts.length > 1 ? parts[1] : "");

            case "CHAT" -> map.put("text", parts.length > 1 ? parts[1] : "");

            case "PONG" -> map.put("timestamp", parts.length > 1 ? parts[1] : "");

            case "SURRENDER" -> {
                // sin campos extra
            }
        }

        return mapper.writeValueAsString(map);
    }

    // =========================
    // LISTENER EXTERNO
    // =========================

    private java.util.function.Consumer<String> onUdpEvent;

    public void onUdpEvent(java.util.function.Consumer<String> listener) {
        this.onUdpEvent = listener;
    }

    // =========================
    // GETTER
    // =========================

    public UdpManager getUdpManager() {
        return udpManager;
    }
}