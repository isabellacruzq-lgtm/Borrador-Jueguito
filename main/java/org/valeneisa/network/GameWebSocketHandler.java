package org.valeneisa.network;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * GameWebSocketHandler
 *
 * Actúa como puente entre el frontend (browser) y el sistema UDP:
 *  - Browser → (WS) → este handler → (UDP) → rival
 *  - Rival  → (UDP) → NetworkBridge → este handler → (WS) → browser
 *
 * Para conectar el NetworkBridge, llamar a setUdpManager() desde Main.java
 * después de construir el contexto de Spring Boot.
 */
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final Logger LOG = Logger.getLogger(GameWebSocketHandler.class.getName());

    // Todas las sesiones WS activas (puede haber una o dos si ambos jugadores
    // abren el browser en el mismo PC, pero normalmente sólo hay una por PC)
    private final Set<WebSocketSession> sessions =
            Collections.newSetFromMap(new ConcurrentHashMap<>());

    private final ObjectMapper mapper = new ObjectMapper();

    // El UdpManager se inyecta desde Main después de que Spring arranca
    private UdpManager udpManager;

    // ─── Setter para inyectar el UdpManager ───────────────────────────────
    public void setUdpManager(UdpManager udpManager) {
        this.udpManager = udpManager;

        // Cuando llega un mensaje UDP del rival, lo reenviamos al(los) browser(s)
        udpManager.onMessage(rawUdp -> {
            try {
                String json = udpToJson(rawUdp);
                LOG.info("[WS-Handler] UDP→WS: " + json);
                broadcast(json);
            } catch (Exception e) {
                LOG.warning("[WS-Handler] Error procesando UDP: " + e.getMessage());
            }
        });
    }

    // ─── Ciclo de vida de sesiones ─────────────────────────────────────────
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        LOG.info("[WS-Handler] Browser conectado: " + session.getId()
                + " | Total: " + sessions.size());

        // Notificar al frontend que está conectado
        try {
            session.sendMessage(new TextMessage(
                    mapper.writeValueAsString(java.util.Map.of(
                            "type", "CONNECT",
                            "message", "Conectado al servidor Celestial Fury"
                    ))
            ));
        } catch (Exception e) {
            LOG.warning("[WS-Handler] No se pudo enviar CONNECT: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        LOG.info("[WS-Handler] Browser desconectado: " + session.getId()
                + " | Status: " + status);
    }

    // ─── Mensajes entrantes desde el browser ──────────────────────────────
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String payload = message.getPayload();
        LOG.info("[WS-Handler] Browser→UDP: " + payload);

        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> msg = mapper.readValue(payload, java.util.Map.class);
            String type = String.valueOf(msg.getOrDefault("type", "")).toUpperCase();

            // Construir mensaje UDP según el tipo
            String udpMsg = switch (type) {
                case "ATTACK" -> {
                    String attackId = String.valueOf(msg.getOrDefault("attackId",
                            msg.getOrDefault("position", "PUNCH")));
                    int damage = ((Number) msg.getOrDefault("damage", 20)).intValue();
                    yield "ATTACK|" + attackId + "|" + damage;
                }
                case "CHAT" -> "CHAT|" + msg.getOrDefault("text", "");
                case "SURRENDER" -> "SURRENDER";
                default -> null;
            };

            if (udpMsg != null && udpManager != null) {
                udpManager.send(udpMsg);
                LOG.info("[WS-Handler] → UDP enviado: " + udpMsg);
            }

        } catch (Exception e) {
            LOG.warning("[WS-Handler] Error parseando mensaje del browser: " + e.getMessage());
        }
    }

    // ─── Broadcast a todos los browsers conectados ────────────────────────
    public void broadcast(String json) {
        sessions.removeIf(s -> !s.isOpen());
        for (WebSocketSession session : sessions) {
            try {
                session.sendMessage(new TextMessage(json));
            } catch (Exception e) {
                LOG.warning("[WS-Handler] Error enviando al browser: " + e.getMessage());
            }
        }
    }

    // ─── Conversor UDP raw → JSON ──────────────────────────────────────────
    private String udpToJson(String raw) throws Exception {
        String[] parts = raw.split("\\|");
        String type = parts[0].toUpperCase();

        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("type", type);

        switch (type) {
            case "ATTACK" -> {
                map.put("attackId", parts.length > 1 ? parts[1] : "");
                map.put("damage", parts.length > 2 ? Integer.parseInt(parts[2]) : 0);
            }
            case "HP_UPDATE" -> {
                map.put("localHp", parts.length > 1 ? Integer.parseInt(parts[1]) : 0);
                map.put("rivalHp", parts.length > 2 ? Integer.parseInt(parts[2]) : 0);
            }
            case "PING" -> map.put("timestamp", parts.length > 1 ? parts[1] : "");
            case "PONG" -> map.put("timestamp", parts.length > 1 ? parts[1] : "");
            case "CHAT" -> map.put("text", parts.length > 1 ? parts[1] : "");
            case "SURRENDER" -> { /* sin campos extra */ }
        }

        return mapper.writeValueAsString(map);
    }
}
