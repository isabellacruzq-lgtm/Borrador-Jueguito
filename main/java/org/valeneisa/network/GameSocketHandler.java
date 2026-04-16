package org.valeneisa.network;

import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

public class GameSocketHandler extends TextWebSocketHandler {

    private ObjectMapper mapper = new ObjectMapper();

    private int vidaJugador = 100;
    private int vidaEnemigo = 100;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("Cliente conectado");
        enviarEstado(session, "¡La pelea ha comenzado!");
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Map<String, String> data = mapper.readValue(message.getPayload(), Map.class);

        String accion = data.get("accion");

        if ("ATACAR".equals(accion)) {
            vidaEnemigo -= 10;
            vidaJugador -= 5;
        }

        enviarEstado(session, "Has atacado!");
    }

    private void enviarEstado(WebSocketSession session, String mensaje) throws Exception {
        Map<String, Object> estado = new HashMap<>();
        estado.put("vidaJugador", vidaJugador);
        estado.put("vidaEnemigo", vidaEnemigo);
        estado.put("mensaje", mensaje);

        session.sendMessage(new TextMessage(mapper.writeValueAsString(estado)));
    }
}