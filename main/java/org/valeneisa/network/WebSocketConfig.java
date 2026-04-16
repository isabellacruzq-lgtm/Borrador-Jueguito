package org.valeneisa.network;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocketConfig — Registra el GameWebSocketHandler en Spring Boot.
 *
 * Endpoint expuesto: ws://<IP_SERVIDOR>:8080/game
 *
 * Para conectarse desde el cliente JavaScript del juego:
 *   const ws = new WebSocket("ws://192.168.1.5:8080/game");
 *
 * CORS: se permite cualquier origen (*) para pruebas en red local.
 * En producción, reemplaza "*" por las IPs específicas de los jugadores.
 */

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new GameSocketHandler(), "/game")
                .setAllowedOrigins("*");
    }
}

