package org.valeneisa.network;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * GameWebSocketHandler — Servidor WebSocket que gestiona la sala de juego.
 *
 * Responsabilidades:
 *   • Acepta conexiones de hasta 2 jugadores.
 *   • Asigna roles (PLAYER_1 / PLAYER_2) al conectarse.
 *   • Retransmite los mensajes de juego entre los dos jugadores.
 *   • Notifica el estado de la sala (esperando / en partida / desconectado).
 *
 * Protocolo JSON de mensajes:
 *   { "type": "JOIN",        "playerId": "...", "playerName": "..." }
 *   { "type": "ATTACK",      "attackId": "...", "damage": 35 }
 *   { "type": "HP_UPDATE",   "myHp": 80, "rivalHp": 60 }
 *   { "type": "TURN",        "playerId": "..." }
 *   { "type": "CHAT",        "text": "..." }
 *   { "type": "SURRENDER" }
 *   { "type": "PING" }
 *
 * Mensajes de servidor → cliente:
 *   { "type": "ROOM_STATUS", "status": "WAITING|READY|DISCONNECTED", "role": "PLAYER_1|PLAYER_2" }
 *   { "type": "RELAY",       "from": "PLAYER_1|PLAYER_2", "payload": { ... } }
 *   { "type": "PONG" }
 *   { "type": "ERROR",       "message": "..." }
 */
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final Logger LOG = Logger.getLogger(GameWebSocketHandler.class.getName());
    private static final int MAX_PLAYERS = 2;

    // Sesiones activas: sessionId -> WebSocketSession
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    // Rol de cada sesión: sessionId -> "PLAYER_1" | "PLAYER_2"
    private final Map<String, String> roles = new ConcurrentHashMap<>();

    private final ObjectMapper mapper = new ObjectMapper();

    // -------------------------------------------------------------------------
    // Ciclo de vida de la conexión
    // -------------------------------------------------------------------------

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        if (sessions.size() >= MAX_PLAYERS) {
            sendError(session, "La sala ya está llena. Máximo " + MAX_PLAYERS + " jugadores.");
            session.close(CloseStatus.SERVICE_OVERLOAD);
            LOG.warning("[WS] Conexión rechazada (sala llena): " + session.getId());
            return;
        }

        String role = sessions.isEmpty() ? "PLAYER_1" : "PLAYER_2";
        sessions.put(session.getId(), session);
        roles.put(session.getId(), role);

        LOG.info("[WS] Jugador conectado: " + session.getId() + " → " + role
                + " | IP: " + getRemoteIp(session));

        // Notifica al jugador recién conectado
        sendToSession(session, buildRoomStatus(
                sessions.size() < MAX_PLAYERS ? "WAITING" : "READY", role));

        // Si ya hay dos jugadores, notifica al primero también
        if (sessions.size() == MAX_PLAYERS) {
            sessions.values().stream()
                    .filter(s -> !s.getId().equals(session.getId()))
                    .forEach(s -> {
                        try {
                            sendToSession(s, buildRoomStatus("READY", roles.get(s.getId())));
                        } catch (IOException e) {
                            LOG.warning("[WS] Error notificando estado READY al rival: " + e.getMessage());
                        }
                    });
            LOG.info("[WS] Sala completa. ¡Partida iniciada!");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String role = roles.remove(session.getId());
        sessions.remove(session.getId());

        LOG.info("[WS] Jugador desconectado: " + session.getId()
                + " (" + role + ") | Razón: " + status);

        // Notifica al jugador restante
        sessions.values().forEach(s -> {
            try {
                sendToSession(s, buildRoomStatus("DISCONNECTED", roles.get(s.getId())));
            } catch (IOException e) {
                LOG.warning("[WS] Error notificando desconexión: " + e.getMessage());
            }
        });
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        LOG.severe("[WS] Error de transporte en " + session.getId() + ": " + exception.getMessage());
        afterConnectionClosed(session, CloseStatus.SERVER_ERROR);
    }

    // -------------------------------------------------------------------------
    // Manejo de mensajes
    // -------------------------------------------------------------------------

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        LOG.fine("[WS] Mensaje recibido de " + session.getId() + ": " + payload);

        Map<String, Object> msg;
        try {
            msg = mapper.readValue(payload, Map.class);
        } catch (Exception e) {
            sendError(session, "JSON inválido: " + e.getMessage());
            return;
        }

        String type = (String) msg.getOrDefault("type", "");

        switch (type.toUpperCase()) {
            case "PING" -> sendToSession(session, Map.of("type", "PONG"));
            case "JOIN" -> handleJoin(session, msg);
            default     -> relayToRival(session, msg);
        }
    }

    // -------------------------------------------------------------------------
    // Lógica de mensajes
    // -------------------------------------------------------------------------

    /**
     * Maneja la unión de un jugador a la sala.
     * El cliente puede enviar su nombre para que el rival lo conozca.
     */
    private void handleJoin(WebSocketSession session, Map<String, Object> msg) throws IOException {
        String playerName = (String) msg.getOrDefault("playerName", "Jugador");
        LOG.info("[WS] JOIN de " + playerName + " (sesión: " + session.getId() + ")");

        // Reenvía al rival para que sepa el nombre del oponente
        Map<String, Object> joinNotice = new LinkedHashMap<>();
        joinNotice.put("type",       "RIVAL_JOINED");
        joinNotice.put("playerName", playerName);
        joinNotice.put("role",       roles.get(session.getId()));
        relayToRival(session, joinNotice);
    }

    /**
     * Retransmite un mensaje al jugador contrario.
     * Añade el campo "from" para que el receptor sepa quién lo envía.
     */
    private void relayToRival(WebSocketSession sender, Map<String, Object> payload) {
        String senderRole = roles.get(sender.getId());

        sessions.values().stream()
                .filter(s -> !s.getId().equals(sender.getId()))
                .forEach(rival -> {
                    try {
                        Map<String, Object> relay = new LinkedHashMap<>();
                        relay.put("type",    "RELAY");
                        relay.put("from",    senderRole);
                        relay.put("payload", payload);
                        sendToSession(rival, relay);
                    } catch (IOException e) {
                        LOG.warning("[WS] Error al retransmitir al rival: " + e.getMessage());
                    }
                });
    }

    // -------------------------------------------------------------------------
    // Utilidades de envío
    // -------------------------------------------------------------------------

    private void sendToSession(WebSocketSession session, Object data) throws IOException {
        String json = mapper.writeValueAsString(data);
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(json));
        }
    }

    private void sendError(WebSocketSession session, String errorMsg) throws IOException {
        sendToSession(session, Map.of("type", "ERROR", "message", errorMsg));
    }

    private Map<String, Object> buildRoomStatus(String status, String role) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type",   "ROOM_STATUS");
        map.put("status", status);
        map.put("role",   role);
        map.put("players", sessions.size());
        return map;
    }

    private String getRemoteIp(WebSocketSession session) {
        var addr = session.getRemoteAddress();
        return addr != null ? addr.getAddress().getHostAddress() : "desconocida";
    }

    // -------------------------------------------------------------------------
    // Diagnóstico
    // -------------------------------------------------------------------------

    public int  getPlayerCount()      { return sessions.size(); }
    public boolean isRoomFull()       { return sessions.size() >= MAX_PLAYERS; }
    public Map<String, String> getRoles() { return Collections.unmodifiableMap(roles); }
}
