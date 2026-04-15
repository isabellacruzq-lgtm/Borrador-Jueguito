package org.valeneisa.network;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Map;
import java.util.logging.Logger;

/**
 * NetworkBridge — Puente entre WebSocket (UI/web) y UDP (comunicación P2P).
 *
 * En Celestial Fury la arquitectura de red es híbrida:
 *   • WebSocket → los clientes HTML/JS usan WS para conectarse al servidor.
 *   • UDP        → el servidor retransmite los eventos críticos del juego
 *                  (ataques, HP, turnos) al otro jugador vía UDP para
 *                  minimizar la latencia.
 *
 * Este bridge:
 *   1. Recibe mensajes del WebSocket handler.
 *   2. Los envía al rival a través de UdpManager.
 *   3. Recibe datagramas UDP del rival y los reenvía al WebSocket del jugador local.
 *
 * Uso típico en Main.java:
 * <pre>
 *   NetworkBridge bridge = new NetworkBridge(
 *       wsHandler,
 *       localUdpPort  = 9001,
 *       rivalIp       = "192.168.1.10",
 *       rivalUdpPort  = 9001
 *   );
 *   bridge.start();
 * </pre>
 */
public class NetworkBridge {

    private static final Logger LOG = Logger.getLogger(NetworkBridge.class.getName());

    private final GameWebSocketHandler wsHandler;
    private final UdpManager           udpManager;
    private final ObjectMapper         mapper = new ObjectMapper();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    public NetworkBridge(GameWebSocketHandler wsHandler,
                         int    localUdpPort,
                         String rivalIp,
                         int    rivalUdpPort) throws UnknownHostException {

        this.wsHandler  = wsHandler;
        this.udpManager = new UdpManager(localUdpPort, rivalIp, rivalUdpPort);
    }

    // -------------------------------------------------------------------------
    // Ciclo de vida
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // WS → UDP  (llamar desde GameWebSocketHandler al recibir un mensaje)
    // -------------------------------------------------------------------------

    /**
     * Convierte un evento de juego recibido por WebSocket y lo envía por UDP al rival.
     *
     * @param jsonPayload JSON del mensaje recibido vía WS, ej. {"type":"ATTACK","attackId":"FIRE","damage":35}
     */
    public void forwardToUdp(String jsonPayload) {
        try {
            Map<?, ?> msg  = mapper.readValue(jsonPayload, Map.class);
            String    type = ((String) msg.getOrDefault("type", "")).toUpperCase();

            switch (type) {
                case "ATTACK" -> udpManager.sendAttack(
                        (String) msg.get("attackId"),
                        (Integer) msg.getOrDefault("damage", 0));

                case "HP_UPDATE" -> udpManager.sendHpUpdate(
                        (Integer) msg.getOrDefault("myHp", 0),
                        (Integer) msg.getOrDefault("rivalHp", 0));

                case "TURN"      -> udpManager.sendTurn((String) msg.get("playerId"));
                case "CHAT"      -> udpManager.sendChat((String) msg.get("text"));
                case "SURRENDER" -> udpManager.sendSurrender();
                default          -> udpManager.send(jsonPayload);
            }
        } catch (Exception e) {
            LOG.warning("[Bridge] Error al procesar mensaje WS→UDP: " + e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // UDP → WS  (callback del UdpManager)
    // -------------------------------------------------------------------------

    /**
     * Recibe un datagrama UDP del rival y lo reenvía como mensaje WebSocket
     * a los clientes conectados.
     */
    private void onUdpMessageReceived(String rawMessage) {
        try {
            String json = udpToJson(rawMessage);
            // Aquí se podría inyectar en el wsHandler para reenviarlo al cliente local.
            // Por simplicidad, se delega al BattleController o a quien escuche el bridge.
            LOG.info("[Bridge] UDP→WS: " + json);
            if (onUdpEvent != null) {
                onUdpEvent.accept(json);
            }
        } catch (Exception e) {
            LOG.warning("[Bridge] Error al procesar mensaje UDP→WS: " + e.getMessage());
        }
    }

    /**
     * Convierte el protocolo UDP de texto plano a JSON normalizado.
     * Entrada: "ATTACK|FIRE_BALL|35"
     * Salida:  {"type":"ATTACK","attackId":"FIRE_BALL","damage":35}
     */
    private String udpToJson(String raw) throws Exception {
        String[] parts = raw.split("\\|");
        String   type  = parts[0].toUpperCase();

        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("type", type);

        switch (type) {
            case "ATTACK" -> {
                map.put("attackId", parts.length > 1 ? parts[1] : "");
                map.put("damage",   parts.length > 2 ? Integer.parseInt(parts[2]) : 0);
            }
            case "HP_UPDATE" -> {
                map.put("myHp",    parts.length > 1 ? Integer.parseInt(parts[1]) : 0);
                map.put("rivalHp", parts.length > 2 ? Integer.parseInt(parts[2]) : 0);
            }
            case "TURN"  -> map.put("playerId", parts.length > 1 ? parts[1] : "");
            case "CHAT"  -> map.put("text",     parts.length > 1 ? parts[1] : "");
            case "PONG"  -> map.put("timestamp", parts.length > 1 ? parts[1] : "");
            // SURRENDER y otros no necesitan campos extra
        }

        return mapper.writeValueAsString(map);
    }

    // -------------------------------------------------------------------------
    // Listener externo (BattleController, etc.)
    // -------------------------------------------------------------------------

    private java.util.function.Consumer<String> onUdpEvent;

    /** Registra el callback que recibe los eventos UDP convertidos a JSON. */
    public void onUdpEvent(java.util.function.Consumer<String> listener) {
        this.onUdpEvent = listener;
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------
    public UdpManager           getUdpManager() { return udpManager; }
    public GameWebSocketHandler getWsHandler()  { return wsHandler; }
}
