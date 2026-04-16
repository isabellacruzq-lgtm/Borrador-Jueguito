package org.valeneisa.network;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.valeneisa.core.BattleControllerHolder;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@ServerEndpoint("/ws")
public class GameWebSocketServer {

    private static final Set<Session> sessions = new CopyOnWriteArraySet<>();

    @OnOpen
    public void onOpen(Session session) {
        sessions.add(session);
        System.out.println("🟢 Front conectado: " + session.getId());
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("📩 Mensaje del frontend: " + message);

        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> msg = mapper.readValue(message, Map.class);

            String type = (String) msg.get("type");

            if ("ATTACK".equals(type)) {
                String attackId = (String) msg.get("attackId");
                int damage = ((Number) msg.get("damage")).intValue();

                // 🔥 ENVÍA A UDP
                BattleControllerHolder.get().realizarAtaque(damage, attackId);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 🔥 ENVÍA AL FRONTEND
    public static void broadcast(String message) {
        for (Session session : sessions) {
            try {
                session.getBasicRemote().sendText(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}